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
