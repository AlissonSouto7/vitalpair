package com.aps.vitalpair.user.domain.model;

/**
 * The look of the person's creature, chosen by them.
 *
 * <p>The mascot used to be drawn from the person's role in the pair: whoever was "you" got one
 * face and the partner got the other, with no way to change it. The first real user picked
 * female during sign-up, saw the other face and asked how to change the mascot; the answer was
 * that she could not. Tying appearance to role, or to sex, is the mistake either way: this is a
 * pet, not a portrait, and someone who marked OTHER has to be able to choose too.
 *
 * <p>Deliberately not called "male" and "female". Naming the options after the drawing rather
 * than after a gender is what keeps the choice a matter of taste, and it leaves room for looks
 * that are not about gender at all.
 */
public enum Mascot {
    /** The original sprout: rounder eyes, thick brows. */
    SPROUT,

    /** The same creature with lashes and a softer brow. */
    BLOSSOM
}
