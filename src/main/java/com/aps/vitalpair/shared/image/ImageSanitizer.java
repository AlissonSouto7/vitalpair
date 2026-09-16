package com.aps.vitalpair.shared.image;

import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Iterator;

import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;

import org.springframework.stereotype.Component;

/**
 * Turns bytes a stranger uploaded into an image this application produced.
 *
 * <p>The central idea is that the file which arrives is never the file that is stored. The
 * pixels are decoded and then written out again by us, into a format we choose. Everything that
 * was not a pixel is gone by construction rather than by inspection, which is what makes this
 * safe against the classes of attack a blocklist would keep missing:
 *
 * <ul>
 *   <li><b>Appended payloads.</b> A JPEG stays a valid JPEG with a PHP script, a ZIP or a
 *       second file glued after its end marker. Decoders ignore the tail; web servers and
 *       archive tools do not. Re-encoding keeps only what the decoder saw, so the tail is
 *       dropped without anyone having to look for it.
 *   <li><b>Polyglots.</b> Files valid as two formats at once (the classic being a GIF whose
 *       header is also valid JavaScript) survive any check that asks "is this an image?",
 *       because the honest answer is yes. Re-encoding answers a different question: the output
 *       is a JPEG we wrote, and it is no longer valid as anything else.
 *   <li><b>Metadata.</b> A photo from a phone carries EXIF, and EXIF routinely carries GPS
 *       coordinates. In this product the avatar is shown to the partner, so shipping the
 *       original would hand over the place the photo was taken. It can also carry a comment
 *       field, which is a place to hide a payload. {@link ImageIO} writes neither.
 *   <li><b>Decompression bombs.</b> A few kilobytes can declare 50000x50000 pixels, and
 *       decoding that asks for about ten gigabytes. The dimensions are read from the header
 *       first, through a reader that does not decode, and an implausible size is refused before
 *       any pixel buffer is allocated.
 *   <li><b>SVG and anything else that is not raster.</b> SVG is a document that can carry
 *       script, so it is XSS with an image extension. It is not in the accepted set, and it
 *       does not survive a raster decode even if the declared type lies.
 * </ul>
 *
 * <p>The declared content type is never trusted. It comes from the client, and a client that is
 * attacking says whatever gets it through. The format is established from the bytes.
 */
@Component
public class ImageSanitizer {

    /**
     * The largest input accepted, before decoding.
     *
     * <p>An avatar does not need more, and the ceiling is what stops the request from becoming
     * a memory-exhaustion tool: everything after this point works on a byte array in heap.
     */
    public static final int MAX_INPUT_BYTES = 4 * 1024 * 1024;

    /**
     * The largest pixel count accepted.
     *
     * <p>Checked against the header, not the file size, because those are unrelated: the point
     * of a decompression bomb is a small file that claims an enormous canvas. Forty megapixels
     * is past any phone camera and far short of what hurts.
     */
    public static final long MAX_PIXELS = 40_000_000L;

    /** The side the stored image is fitted into. An avatar renders at 56px at the largest. */
    public static final int OUTPUT_SIZE = 512;

    /** What we are willing to decode. Established from the bytes, never from the client. */
    private static final byte[] JPEG_MAGIC = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF};

    private static final byte[] PNG_MAGIC = {(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A};
    private static final byte[] RIFF_MAGIC = {'R', 'I', 'F', 'F'};
    private static final byte[] WEBP_MAGIC = {'W', 'E', 'B', 'P'};

    /**
     * Validates, normalises and re-encodes an uploaded image.
     *
     * @param input the raw bytes as they arrived
     * @return a square JPEG this application wrote, at most {@link #OUTPUT_SIZE} a side
     * @throws InvalidImageException when the bytes are not an image we accept, or describe one
     *     too large to decode safely
     */
    public byte[] sanitize(byte[] input) {
        if (input == null || input.length == 0) {
            throw new InvalidImageException("Envie uma imagem.");
        }
        if (input.length > MAX_INPUT_BYTES) {
            throw new InvalidImageException("A imagem é grande demais. Envie uma foto de até 4 MB.");
        }
        requireKnownMagicBytes(input);

        BufferedImage decoded = decodeWithinLimits(input);
        try {
            return encodeJpeg(squareThumbnail(decoded));
        } finally {
            decoded.flush();
        }
    }

    /**
     * Refuses anything whose leading bytes are not JPEG, PNG or WebP.
     *
     * <p>A first filter, not the protection: it is cheap, it rejects the obvious before any
     * decoder is handed the data, and it is the step that turns "the client says it is a JPEG"
     * into "the file begins like a JPEG". The re-encode is what actually makes the output safe.
     */
    private static void requireKnownMagicBytes(byte[] input) {
        boolean known = startsWith(input, JPEG_MAGIC)
                || startsWith(input, PNG_MAGIC)
                // WebP is a RIFF container: "RIFF", four bytes of length, then "WEBP".
                || (startsWith(input, RIFF_MAGIC) && input.length > 12 && regionMatches(input, 8, WEBP_MAGIC));
        if (!known) {
            throw new InvalidImageException("Formato não aceito. Envie um JPEG, PNG ou WebP.");
        }
    }

    /**
     * Reads the dimensions from the header, refuses an implausible canvas, and only then
     * decodes.
     *
     * <p>The order is the whole point. {@link ImageIO#read} allocates a raster sized by what the
     * header claims, so asking it first and checking afterwards is how a 40 KB file turns into
     * an OutOfMemoryError. {@link ImageReader#getWidth} parses the header without decoding.
     */
    private static BufferedImage decodeWithinLimits(byte[] input) {
        try (ImageInputStream stream = ImageIO.createImageInputStream(new ByteArrayInputStream(input))) {
            if (stream == null) {
                throw new InvalidImageException("Não foi possível ler essa imagem.");
            }
            Iterator<ImageReader> readers = ImageIO.getImageReaders(stream);
            if (!readers.hasNext()) {
                // The magic bytes matched but no installed reader accepts the content: a
                // truncated or hand-crafted file wearing a valid header.
                throw new InvalidImageException("Não foi possível ler essa imagem.");
            }
            ImageReader reader = readers.next();
            try {
                reader.setInput(stream, true, true);
                long width = reader.getWidth(0);
                long height = reader.getHeight(0);
                if (width <= 0 || height <= 0 || width * height > MAX_PIXELS) {
                    throw new InvalidImageException("A imagem tem dimensões demais. Envie uma foto menor.");
                }
                BufferedImage image = reader.read(0);
                if (image == null) {
                    throw new InvalidImageException("Não foi possível ler essa imagem.");
                }
                return image;
            } finally {
                reader.dispose();
            }
        } catch (InvalidImageException e) {
            throw e;
        } catch (IOException | RuntimeException e) {
            // A malformed file makes decoders throw all sorts of things, including
            // ArrayIndexOutOfBounds from inside the JDK's own readers. None of them is a server
            // fault, so none of them should surface as a 500.
            throw new InvalidImageException("Não foi possível ler essa imagem.");
        }
    }

    /**
     * Centre-crops to a square and scales to {@link #OUTPUT_SIZE}.
     *
     * <p>Cropping rather than squashing, because the avatar is rendered in a square tile and a
     * stretched face is worse than a cropped one. The output is drawn onto a fresh RGB canvas,
     * which also flattens any alpha channel onto white: JPEG has no transparency, and without a
     * background a PNG with transparent areas encodes them as black.
     */
    private static BufferedImage squareThumbnail(BufferedImage source) {
        int side = Math.min(source.getWidth(), source.getHeight());
        int x = (source.getWidth() - side) / 2;
        int y = (source.getHeight() - side) / 2;
        int target = Math.min(OUTPUT_SIZE, side);

        BufferedImage output = new BufferedImage(target, target, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = output.createGraphics();
        try {
            g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
            g.setColor(java.awt.Color.WHITE);
            g.fillRect(0, 0, target, target);
            g.drawImage(source, 0, 0, target, target, x, y, x + side, y + side, null);
        } finally {
            g.dispose();
        }
        return output;
    }

    private static byte[] encodeJpeg(BufferedImage image) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try {
            if (!ImageIO.write(image, "jpeg", out)) {
                throw new InvalidImageException("Não foi possível processar essa imagem.");
            }
        } catch (IOException e) {
            throw new InvalidImageException("Não foi possível processar essa imagem.");
        } finally {
            image.flush();
        }
        return out.toByteArray();
    }

    private static boolean startsWith(byte[] input, byte[] prefix) {
        return regionMatches(input, 0, prefix);
    }

    private static boolean regionMatches(byte[] input, int offset, byte[] expected) {
        if (input.length < offset + expected.length) {
            return false;
        }
        for (int i = 0; i < expected.length; i++) {
            if (input[offset + i] != expected[i]) {
                return false;
            }
        }
        return true;
    }
}
