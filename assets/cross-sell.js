import { Component } from '@theme/component';

/**
 * @typedef {object} VariantData
 * @property {string} [price]
 * @property {string | null} [compareAtPrice]
 * @property {string | null} [image]
 * @property {string | null} [imageSrcset]
 * @property {string} [imageSizes]
 * @property {string | null} [flyImage]
 * @property {string} [alt]
 */

/**
 * @typedef {object} Refs
 * @property {HTMLElement} [track]
 * @property {HTMLButtonElement} [prevButton]
 * @property {HTMLButtonElement} [nextButton]
 * @property {HTMLAnchorElement} [skipLink]
 * @property {HTMLElement} [skipTarget]
 */

/**
 * A custom element that renders a cross-sell carousel.
 * Handles: Carousel navigation and Variant selection
 * @extends {Component<Refs>}
 */
class CrossSellComponent extends Component {
  connectedCallback() {
    super.connectedCallback();

    this.addEventListener('scroll', this.updateArrowState, { capture: true });
    window.addEventListener('resize', this.updateArrowState);

    this.updateArrowState();
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    this.removeEventListener('scroll', this.updateArrowState, { capture: true });
    window.removeEventListener('resize', this.updateArrowState);
  }

  scrollPrev = () => {
    this.#scrollByCard(-1);
  };

  scrollNext = () => {
    this.#scrollByCard(1);
  };

  /**
   * Scroll the carousel by one card
   * @param {number} direction
   */
  #scrollByCard(direction) {
    const { track } = this.refs;
    const card = track?.querySelector('[data-cross-sell-card]');

    if (!track || !card) return;

    track.scrollBy({
      left: card.getBoundingClientRect().width * direction,
      behavior: 'smooth',
    });
  }

  // Update the enabled/disabled state of the carousel arrows
  updateArrowState = () => {
    const { track, prevButton, nextButton, skipLink, skipTarget } = this.refs;

    if (!track) return;

    const { scrollLeft, scrollWidth, clientWidth } = track;
    const maxScroll = scrollWidth - clientWidth;

    // Hide arrows and skip links when there is nothing to scroll
    const hasOverflow = maxScroll > 1;

    if (prevButton) {
      prevButton.hidden = !hasOverflow;
      prevButton.disabled = scrollLeft <= 1;
    }

    if (nextButton) {
      nextButton.hidden = !hasOverflow;
      nextButton.disabled = scrollLeft >= maxScroll - 1;
    }

    if (skipLink) skipLink.hidden = !hasOverflow;
    if (skipTarget) skipTarget.hidden = !hasOverflow;
  };

  /**
   * Handle variant selection changes
   * @param {Event} event
   */
  handleChange = (event) => {
    const select = event.target;

    if (!(select instanceof HTMLSelectElement)) return;

    const card = select.closest('[data-cross-sell-card]');
    const variantId = select.value;
    const option = select.selectedOptions[0];
    const data = this.#parseVariantData(option);

    if (!card || !data) return;

    const variantInput = card.querySelector('[data-cross-sell-variant-id]');
    const addButton = card.querySelector('[data-cross-sell-add]');
    const productLink = card.querySelector('[data-cross-sell-product-link]');
    const priceEl = card.querySelector('[data-cross-sell-price]');
    const comparePriceEl = card.querySelector('[data-cross-sell-compare-price]');
    const imageEl = card.querySelector('[data-cross-sell-image]');
    const addContainer = card.querySelector('add-to-cart-component');

    if (variantInput instanceof HTMLInputElement) variantInput.value = variantId;
    if (addButton instanceof HTMLButtonElement) addButton.disabled = false;

    this.#updateProductLink(productLink, variantId);
    this.#updatePrice(priceEl, comparePriceEl, data);

    if (imageEl instanceof HTMLImageElement) this.#applyImage(imageEl, data);
    if (addContainer instanceof HTMLElement) this.#applyFlyImage(addContainer, data);
  };

  /**
   * Parse the JSON variant data
   * @param {HTMLOptionElement | undefined} option
   * @returns {VariantData | null}
   */
  #parseVariantData(option) {
    if (!option?.dataset.variant) return null;

    try {
      return JSON.parse(option.dataset.variant);
    } catch (error) {
      return null;
    }
  }

  /**
   * Update the product URL
   * @param {Element | null} productLink
   * @param {string} variantId
   */
  #updateProductLink(productLink, variantId) {
    if (!(productLink instanceof HTMLAnchorElement)) return;

    const url = new URL(productLink.href, window.location.origin);
    url.searchParams.set('variant', variantId);
    productLink.href = url.toString();
  }

  /**
   * Update the price and compare-at price
   * @param {Element | null} priceEl
   * @param {Element | null} comparePriceEl
   * @param {VariantData} data
   */
  #updatePrice(priceEl, comparePriceEl, data) {
    if (data.price && priceEl) {
      priceEl.textContent = data.price;
    }

    if (comparePriceEl instanceof HTMLElement) {
      comparePriceEl.textContent = data.compareAtPrice ?? '';
      comparePriceEl.hidden = !data.compareAtPrice;
    }
  }

  /**
   * Set an img attribute when a value is present, otherwise remove it
   * @param {Element} img
   * @param {string} name
   * @param {string | null | undefined} value
   */
  #setImgAttribute(img, name, value) {
    if (value) {
      img.setAttribute(name, value);
    } else {
      img.removeAttribute(name);
    }
  }

  /**
   * Update the card image
   * @param {HTMLImageElement} imageEl
   * @param {VariantData} data
   */
  #applyImage(imageEl, data) {
    if (!data.image) return;

    imageEl.src = data.image;
    imageEl.alt = data.alt ?? '';
    this.#setImgAttribute(imageEl, 'srcset', data.imageSrcset);
    this.#setImgAttribute(imageEl, 'sizes', data.imageSizes);
  }

  /**
   * Update the fly-to-cart media
   * @param {HTMLElement} addContainer
   * @param {VariantData} data
   */
  #applyFlyImage(addContainer, data) {
    if (data.flyImage) {
      addContainer.dataset.productVariantMedia = data.flyImage;
    }
  }
}

if (!customElements.get('cross-sell-component')) {
  customElements.define('cross-sell-component', CrossSellComponent);
}