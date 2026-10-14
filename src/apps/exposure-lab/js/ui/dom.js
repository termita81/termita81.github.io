/** Small DOM helpers shared by the UI modules. */

export const $ = (id) => document.getElementById(id);

/** A copy of the single root element of a `<template>`. */
export const cloneTemplate = (id) => $(id).content.firstElementChild.cloneNode(true);

/** A copy of everything inside a `<template>`, for templates with several root elements. */
export const cloneTemplateContent = (id) => $(id).content.cloneNode(true);

/** Restart the CSS animation that `className` triggers on `element`. */
export function restartAnimation(element, className) {
  element.classList.remove(className);
  void element.offsetWidth; // force a reflow, so that adding the class starts the animation anew
  element.classList.add(className);
}
