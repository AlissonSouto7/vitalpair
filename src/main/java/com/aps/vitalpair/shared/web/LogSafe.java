package com.aps.vitalpair.shared.web;

/**
 * Strips control characters from values that came from a request before they reach a log.
 *
 * <p>Without this, a request to a path containing a newline lets the caller write whatever
 * they like into the log file, including lines that look like genuine entries from another
 * part of the system. Anyone reading the log, or any tool parsing it, is then reading
 * attacker-controlled text presented as our own. CodeQL reports it as java/log-injection.
 */
public final class LogSafe {

    /** Longest value kept. Beyond this a caller could flood the log with one request. */
    private static final int MAX_LENGTH = 200;

    private LogSafe() {}

    /**
     * Returns the value with control characters replaced by {@code _}, truncated to a sane
     * length. Null becomes {@code <null>} so a log line never reads "null" ambiguously.
     */
    public static String value(String raw) {
        if (raw == null) {
            return "<null>";
        }
        String truncated = raw.length() > MAX_LENGTH ? raw.substring(0, MAX_LENGTH) + "..." : raw;
        StringBuilder out = new StringBuilder(truncated.length());
        for (char c : truncated.toCharArray()) {
            out.append(Character.isISOControl(c) ? '_' : c);
        }
        return out.toString();
    }
}
