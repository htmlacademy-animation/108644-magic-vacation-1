import throttle from 'lodash/throttle';

export default class FullPageScroll {
  constructor() {
    this.THROTTLE_TIMEOUT = 2000;
    this.SECTION_PRIZE_DELAY = 2000;
    this.SCREEN_ELEMENT_ACTIVE_DELAY = 100;

    this.screenElements = document.querySelectorAll(`.screen:not(.screen--result)`);
    this.menuElements = document.querySelectorAll(`.page-header__menu .js-menu-link`);

    this.activeScreen = 0;
    this.onScrollHandler = this.onScroll.bind(this);
    this.onUrlHashChengedHandler = this.onUrlHashChanged.bind(this);

    window.addEventListener(`load`, this.onLoad.bind(this));
  }

  init() {
    document.addEventListener(`wheel`, throttle(this.onScrollHandler, this.THROTTLE_TIMEOUT, {trailing: true}));
    window.addEventListener(`popstate`, this.onUrlHashChengedHandler);

    this.onUrlHashChanged();
  }

  onLoad() {
    document.querySelector(`body`).classList.add(`body--load-complete`);
    window.removeEventListener(`load`, this.onLoad);
  }

  onScroll(evt) {
    const currentPosition = this.activeScreen;
    this.reCalculateActiveScreenPosition(evt.deltaY);
    if (currentPosition !== this.activeScreen) {
      this.changePageDisplay();
    }
  }

  onUrlHashChanged() {
    const newIndex = Array.from(this.screenElements).findIndex((screen) => location.hash.slice(1) === screen.id);
    this.activeScreen = (newIndex < 0) ? 0 : newIndex;
    this.changePageDisplay();
  }

  changePageDisplay() {
    this.changeVisibilityDisplay();
    this.changeActiveMenuItem();
    this.emitChangeDisplayEvent();
  }

  hideSection() {
    this.screenElements.forEach((screen, index) => {
      if (index === this.activeScreen) {
        return;
      }

      screen.removeAttribute(`style`);
      screen.classList.add(`screen--hidden`);
      screen.classList.remove(`active`);
    });
  }

  changeVisibilityDisplay() {
    let timeout;
    const isPrizeSectionActive = this.screenElements[this.activeScreen].getAttribute(`id`) === `prizes`;
    if (isPrizeSectionActive) {
      const prizeSectionDelayTimeout = setTimeout(() => {
        this.hideSection();
        clearTimeout(prizeSectionDelayTimeout);
      }, this.SECTION_PRIZE_DELAY);
    } else {
      this.hideSection();
    }

    this.screenElements[this.activeScreen].classList.remove(`screen--hidden`);
    this.screenElements[this.activeScreen].setAttribute(`style`, `position: absolute; inset: 0;`);
    timeout = setTimeout(() => {
      this.screenElements[this.activeScreen].classList.add(`active`);
      clearTimeout(timeout);
    }, this.SCREEN_ELEMENT_ACTIVE_DELAY);
  }

  changeActiveMenuItem() {
    const activeItem = Array.from(this.menuElements).find((item) => item.dataset.href === this.screenElements[this.activeScreen].id);
    if (activeItem) {
      this.menuElements.forEach((item) => item.classList.remove(`active`));
      activeItem.classList.add(`active`);
    }
  }

  emitChangeDisplayEvent() {
    const event = new CustomEvent(`screenChanged`, {
      detail: {
        'screenId': this.activeScreen,
        'screenName': this.screenElements[this.activeScreen].id,
        'screenElement': this.screenElements[this.activeScreen]
      }
    });

    document.body.dispatchEvent(event);
  }

  reCalculateActiveScreenPosition(delta) {
    if (delta > 0) {
      this.activeScreen = Math.min(this.screenElements.length - 1, ++this.activeScreen);
    } else {
      this.activeScreen = Math.max(0, --this.activeScreen);
    }
  }
}
