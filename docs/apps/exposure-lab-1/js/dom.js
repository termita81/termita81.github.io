export const $ = id => document.getElementById(id);
export const cloneTemplate = id => $(id).content.firstElementChild.cloneNode(true);
