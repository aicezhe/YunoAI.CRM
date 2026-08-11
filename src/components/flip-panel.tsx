"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";

/** Never fires — the value is constant per environment, so there is nothing
 *  to subscribe to. useSyncExternalStore is here purely for its one useful
 *  property: a different snapshot on the server than on the client, without
 *  a setState-in-effect to get there. */
const subscribeToNothing = () => () => {};

/**
 * The record card, opened as a panel that flips in over the list it was
 * clicked from — carried over from yuno-crm v1, where opening a company from
 * search did exactly this.
 *
 * Why a flip and not a fade: the list and the record are the same object at
 * two levels of detail, and a rotation says that. The row does not go
 * anywhere, it turns over. A fade would read as one screen replacing
 * another, which is what the rest of the app's navigation already does.
 *
 * Mounted by the intercepting routes under (app)/@modal, so this is only
 * ever the *soft*-navigation view: clicking a row inside the app flips the
 * record open over the list, while opening the same URL directly (a
 * bookmark, a reload, a shared link) renders the ordinary full page. Same
 * URL either way — the overlay is a presentation, not a separate route.
 */
export function FlipPanel({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();

  // Local, rather than closing by navigating straight away: router.back()
  // unmounts this subtree on the spot, and an element that is already gone
  // cannot animate out. So the exit plays against this flag first, and the
  // navigation happens in onExitComplete once the panel has actually left.
  const [open, setOpen] = useState(true);

  // Navigating back is guarded because there are two routes to it: the exit
  // animation finishing, and the fallback below. Whichever gets there first
  // wins; the other becomes a no-op. Without this, both fire and the second
  // router.back() pops a second entry off the history stack, throwing the
  // user out of the section they were in.
  const wentBack = useRef(false);
  const finish = useCallback(() => {
    if (wentBack.current) return;
    wentBack.current = true;
    router.back();
  }, [router]);

  // The fallback. An exit animation only advances while the tab is being
  // painted — a backgrounded tab suspends requestAnimationFrame, so
  // onExitComplete never arrives, and someone who dismisses the panel and
  // immediately switches away comes back to it still sitting there, its
  // route never popped. The timer is longer than the 220ms exit, so in the
  // normal case the animation always wins and this never runs.
  const close = useCallback(() => {
    setOpen(false);
    setTimeout(finish, 600);
  }, [finish]);

  // Portalled to <body>, and this flag is what makes that safe to do on a
  // server-rendered tree: document does not exist during SSR, so the first
  // client render has to match the server's empty one before the portal
  // opens.
  //
  // The portal is not stylistic. `position: fixed` is resolved against the
  // nearest ancestor that has a transform, not against the viewport, and
  // (app)/template.tsx wraps every route in `.route-enter` — whose animation
  // leaves a transform on the element permanently (`both`). Rendered in
  // place, the panel measured itself against that box and came out 1216x0,
  // parked 752px down the page. Escaping to <body> is the fix that does not
  // require the rest of the app to avoid transforms forever.
  const mounted = useSyncExternalStore(subscribeToNothing, () => true, () => false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [close]);

  // The list underneath must not scroll while the panel is over it —
  // otherwise a trackpad flick moves the background instead of the record.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence onExitComplete={finish}>
      {open && (
        <>
          <motion.div
            key="flip-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={close}
            className="fixed inset-0 z-40 bg-gray-900/25 backdrop-blur-sm"
          />

          {/*
            transformPerspective lives on the rotating element's own style
            rather than as a `perspective` on a parent wrapper: with no
            perspective at all a rotateY flattens into a horizontal squash
            with no depth to it.

            Deliberately no layoutId tying this to the row that opened it. A
            layout projection rewrites `transform` on every frame to morph one
            box into the other, and a 3D rotation underneath that shears the
            content diagonally. Morph and flip cannot both own the transform;
            the flip is the one worth having. (Learned the hard way in v1 —
            the same note sits in that codebase.)
          */}
          <motion.div
            key="flip-panel"
            role="dialog"
            aria-modal="true"
            initial={reduceMotion ? { opacity: 0 } : { rotateY: -90, opacity: 0 }}
            animate={reduceMotion ? { opacity: 1 } : { rotateY: 0, opacity: 1 }}
            exit={
              reduceMotion
                ? { opacity: 0, transition: { duration: 0.15 } }
                : { rotateY: 90, opacity: 0, transition: { duration: 0.22, ease: "easeIn" } }
            }
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformPerspective: 1600, transformStyle: "preserve-3d" }}
            className="fixed inset-3 z-50 sm:inset-8"
          >
            <div className="relative h-full w-full overflow-y-auto rounded-[28px] border border-brand-200/70 bg-canvas shadow-brand">
              <button
                onClick={close}
                aria-label="Close"
                className="absolute top-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 transition-colors duration-150 ease-out hover:bg-brand-100/70 hover:text-gray-700"
              >
                <X className="h-4.5 w-4.5" strokeWidth={2} />
              </button>
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
