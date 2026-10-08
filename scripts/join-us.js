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
  dialog.querySelector(".join-phd-close").addEventListener("click", () => dialog.close());
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
    )) dialog.close();
  });
})();
