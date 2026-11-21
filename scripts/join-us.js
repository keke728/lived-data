/* Get in touch: the hand waves once when the section comes into view, and again on hover. */
(() => {
  const contact = document.querySelector(".join-contact");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!contact || reduceMotion) return;

  const wave = () => {
    contact.classList.remove("is-waving");
    void contact.offsetWidth; /* restart the animation */
    contact.classList.add("is-waving");
  };
  contact.querySelector(".join-wave-hand").addEventListener("animationend", () => contact.classList.remove("is-waving"));
  contact.addEventListener("pointerenter", wave);

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      window.setTimeout(wave, 300);
      observer.disconnect();
    }, { threshold: 0.6 });
    observer.observe(contact);
  }
})();

/* Prospective PhD information on the Join Us page. */
(() => {
  const trigger = document.querySelector(".join-phd-trigger");
  const dialog = document.querySelector("#prospective-phd-dialog");
  if (!trigger || !dialog || typeof dialog.showModal !== "function") return;

  trigger.hidden = false;
  trigger.addEventListener("click", () => {
    dialog.showModal();
    document.body.classList.add("phd-dialog-open");
  });
  /* Close softly: play the closing animation, then close the native dialog. */
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const closeSoftly = () => {
    if (reduceMotion || dialog.classList.contains("is-closing")) return dialog.close();
    dialog.classList.add("is-closing");
    window.setTimeout(() => {
      dialog.classList.remove("is-closing");
      dialog.close();
    }, 260);
  };
  dialog.querySelector(".join-phd-close").addEventListener("click", closeSoftly);
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeSoftly();
  });
  // Native dialog handles Escape and keeps keyboard focus inside the popup.
  dialog.addEventListener("close", () => {
    document.body.classList.remove("phd-dialog-open");
    trigger.focus();
  });
  dialog.addEventListener("click", (event) => {
    const bounds = dialog.getBoundingClientRect();
    if (event.target === dialog && (
      event.clientX < bounds.left || event.clientX > bounds.right ||
      event.clientY < bounds.top || event.clientY > bounds.bottom
    )) closeSoftly();
  });
})();
