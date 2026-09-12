#!/bin/sh
# Asks nginx to re-read its files once a day, from inside its own container.
#
# nginx reads a certificate once, at startup. certbot renews it on disk long before it
# expires, but the running process keeps serving the old one until something reloads it.
# This used to be a second container holding the Docker socket, which made that container
# root on the host for the sake of one signal a day. A loop started from the entrypoint
# sends the same signal without any privilege at all.
#
# Started in the background so the entrypoint carries on to start nginx; the first reload
# is a day away, by which time the master process has long been up.
set -eu

(
  while :; do
    sleep 86400
    nginx -s reload || true
  done
) &
