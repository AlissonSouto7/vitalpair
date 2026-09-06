package com.aps.vitalpair.shared.web;

import java.io.IOException;
import java.util.UUID;
import java.util.regex.Pattern;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Gives every request an id, in the log and in the response.
 *
 * <p>Without one, a user reporting "it failed around three o'clock" leaves whoever is
 * investigating to guess which of the thousands of lines at that time belongs to them. With
 * one, the id on their error screen finds the exact request.
 *
 * <p>An id supplied by the caller is honoured, so a chain of services can share it, but it is
 * validated first: the value goes straight into log lines and into a response header, so an
 * unchecked one lets a caller forge log entries or inject a header. Anything that is not a
 * short, plain token is replaced rather than rejected, because a bad id is no reason to fail
 * a request that is otherwise fine.
 *
 * <p>Runs first, before security. A request rejected with 401 still deserves an id: those are
 * exactly the lines someone reads when investigating an authentication problem.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class CorrelationIdFilter extends OncePerRequestFilter {

    public static final String HEADER = "X-Request-Id";

    /** Letters, digits, dash and underscore, at most 64 characters. */
    private static final Pattern ACCEPTABLE = Pattern.compile("[A-Za-z0-9_-]{1,64}");

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String requestId = resolve(request.getHeader(HEADER));
        RequestContext.putRequestId(requestId);
        // Set before the chain runs: a response that is committed early (a 429 written by the
        // rate limiter, say) would otherwise go out without the header.
        response.setHeader(HEADER, requestId);
        try {
            chain.doFilter(request, response);
        } finally {
            // The thread goes back to the pool and will serve someone else. Anything left in
            // the MDC would be attributed to that next request.
            RequestContext.clear();
        }
    }

    private static String resolve(String supplied) {
        if (supplied != null && ACCEPTABLE.matcher(supplied).matches()) {
            return supplied;
        }
        return UUID.randomUUID().toString();
    }
}
