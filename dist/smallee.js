(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory(root));
  } else if (typeof exports === 'object') {
    module.exports = factory(root);
  } else {
    root.Smallee = factory(root);
  }
})(typeof global !== 'undefined' ? global : window || this.window || this.global, function(root) {
  'use strict';

  /**
   * Closest method polyfill
   */
  (function(element) {
    element.matches =
      element.matches ||
      element.mozMatchesSelector ||
      element.msMatchesSelector ||
      element.oMatchesSelector ||
      element.webkitMatchesSelector;
    element.closest =
      element.closest ||
      function closest(selector) {
        if (!this) return null;
        if (this.matches(selector)) return this;
        if (!this.parentElement) {
          return null;
        } else return this.parentElement.closest(selector);
      };
  })(Element.prototype);

  const classes = {
    smallee: 'smallee',
    inner: 'smallee-inner',
    track: 'smallee-track',
    slide: 'smallee-slide',
    slideFade: 'smallee-slide_fade',
    slideActive: 'smallee-slide_active',
    prev: 'smallee-prev',
    next: 'smallee-next',
    prevDisabled: 'smallee-prev_disabled',
    nextDisabled: 'smallee-next_disabled'
  };

  const defaultSettings = {
    controls: false,
    delay: 300,
    easeFunc: 'ease-in-out', // can be any transition function
    effect: 'slide',
    loop: false,
    resizeTimeout: 1000,
    responsive: false,
    slidesToScroll: 1,
    slidesToShow: 1,
    swipeable: false,
    threshold: 100
  };

  const requestAnimationFrame =
    window.requestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.msRequestAnimationFrame;

  const cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame;

  window.requestAnimationFrame = requestAnimationFrame;
  window.cancelAnimationFrame = cancelAnimationFrame;
  window.Smallee = Smallee || {};

  function Smallee(settings) {
    if (typeof settings !== 'object' || typeof settings.selector === 'undefined') {
      console.log('🚫 Something went wrong. Please check the doc for any mistakes in config.');
      return;
    }

    this.selector = document.querySelector(settings.selector);
    this.slides = Array.prototype.slice.call(this.selector.children);
    this.numberOfSlides = this.slides.length;
    this.settings = mergeSettings(defaultSettings, settings);
    this.settings.transition = `${this.settings.easeFunc} ${this.settings.delay}ms`;

    init.call(this);
  }

  function prevDefAndStopProp(event) {
    event.preventDefault();
    event.stopPropagation();
  }

  function mergeSettings(defaultSettings, userSettings) {
    for (let key in defaultSettings) {
      if (!userSettings[key]) {
        userSettings[key] = defaultSettings[key];
      }
    }
    return userSettings;
  }

  const init = function() {
    const fragment = build.call(this, this.settings.effect);
    this.sliderCoords = {
      start: null,
      wasMovedOn: 0
    };

    this.selector.appendChild(fragment);
    setDimensions.call(this);
    this.stepRange = (this.selector.clientWidth / this.settings.slidesToShow) * this.settings.slidesToScroll;
    this.scrollLimit = -(
      (this.numberOfSlides - this.settings.slidesToShow) *
      (this.stepRange / this.settings.slidesToScroll)
    );

    this.settings.arrows && setArrows.call(this);
    this.settings.swipeable && initSwipeEvents.call(this);
    this.settings.responsive && resizeHandler.call(this);
  };

  const build = function(effectType) {
    const fragment = document.createDocumentFragment();
    this.selector.classList.add(classes.smallee);
    this.inner = document.createElement('DIV');
    this.inner.classList.add(classes.inner);

    switch (effectType) {
      case 'slide':
      default:
        this.track = document.createElement('DIV');
        this.track.classList.add(classes.track);
        this.slides.forEach((item, i) => {
          item.setAttribute('data-index', i);
          item.classList.add(classes.slide);
          this.track.appendChild(item);
        });
        this.inner.appendChild(this.track);
        break;
    }

    fragment.appendChild(this.inner);
    return fragment;
  };

  const setDimensions = function() {
    switch (this.settings.effect) {
      case 'slide':
      default:
        const sliderWidth = this.selector.clientWidth;
        this.track.style.width = `${(sliderWidth * this.numberOfSlides) / this.settings.slidesToShow}px`;
        this.track.style.transition = this.settings.transition;
        this.slides.forEach(item => {
          item.style.float = 'left';
          item.style.width = `${100 / this.slides.length}%`;
        });
    }
  };

  const setArrows = function() {
    this.prev = document.createElement('BUTTON');
    this.prev.type = 'button';
    this.prev.classList.add(classes.prev);

    this.next = document.createElement('BUTTON');
    this.next.type = 'button';
    this.next.classList.add(classes.next);

    this.selector.appendChild(this.prev);
    this.selector.appendChild(this.next);

    initClickEvents.call(this);
    setArrowsState.call(this);
  };

  const setArrowsState = function() {
    if (!this.settings.arrows || this.settings.loop) return;
    if (this.sliderCoords.wasMovedOn === this.scrollLimit) {
      this.next.classList.add(classes.nextDisabled);
    } else {
      this.next.classList.remove(classes.nextDisabled);
    }

    if (this.sliderCoords.wasMovedOn === 0) {
      this.prev.classList.add(classes.prevDisabled);
    } else {
      this.prev.classList.remove(classes.prevDisabled);
    }
  };

  const defineSmalleeWasTranslatedOn = function() {
    const translate = this.track.style.transform;
    return translate ? Number(translate.slice(translate.indexOf('(') + 1, translate.indexOf('p'))) : 0;
  };

  const clearTransition = function() {
    this.track.style.transition = '0s';
  };

  const restoreTransition = function() {
    this.track.style.transition = this.settings.transition;
  };

  const getDirection = function() {
    if (event.target.closest(`.${classes.next}`)) {
      this.changeSlide('next');
    }
    if (event.target.closest(`.${classes.prev}`)) {
      this.changeSlide('prev');
    }
  };

  const initClickEvents = function() {
    const bindGetDirection = getDirection.bind(this);
    this.selector.addEventListener('click', bindGetDirection);
  };

  const mouseDown = function(event) {
    this.isDown = true;
    this.sliderCoords.start = event.clientX;
    clearTransition.call(this);
  };

  const mouseUp = function() {
    this.isDown = false;
    if (event.clientX - this.sliderCoords.start < -this.settings.threshold) {
      this.changeSlide('next');
      return;
    }
    if (event.clientX - this.sliderCoords.start > this.settings.threshold) {
      this.changeSlide('prev');
      return;
    }
    restoreTransition.call(this);
    this.track.style.transform = `translate3d(${this.sliderCoords.wasMovedOn}px, 0, 0)`;
  };

  const mouseMove = function(event) {
    if (this.isDown && this.settings.effect !== 'fade') {
      this.track.style.transform = `translate3d(${this.sliderCoords.wasMovedOn +
        event.clientX -
        this.sliderCoords.start}px, 0, 0)`;
    }
  };

  const mouseLeave = function() {
    if (this.isDown) {
      this.isDown = false;
      restoreTransition.call(this);
      if (event.clientX - this.sliderCoords.start < -this.settings.threshold) {
        this.changeSlide('next');
        return;
      }
      if (event.clientX - this.sliderCoords.start > this.settings.threshold) {
        this.changeSlide('prev');
        return;
      }
      this.track.style.transform = `translate3d(${this.sliderCoords.wasMovedOn}px, 0, 0)`;
    }
  };

  const preventDragStart = function(event) {
    prevDefAndStopProp(event);
  };

  const initSwipeEvents = function() {
    const bindMouseDown = mouseDown.bind(this);
    const bindMouseUp = mouseUp.bind(this);
    const bindMouseMove = mouseMove.bind(this);
    const bindMouseLeave = mouseLeave.bind(this);
    const bindPreventDragStart = preventDragStart.bind(this);

    this.selector.addEventListener('mousedown', bindMouseDown);
    this.selector.addEventListener('mouseup', bindMouseUp);
    this.selector.addEventListener('mousemove', bindMouseMove);
    this.selector.addEventListener('mouseleave', bindMouseLeave);
    this.selector.addEventListener('dragstart', bindPreventDragStart);
  };

  const resizeHandler = function() {
    const _this = this;
    this.resized = false;

    window.addEventListener('resize', function() {
      _this.resized = true;
      const timer = setTimeout(() => {
        if (_this.resized) {
          clearTimeout(timer);
          setDimensions.call(_this);
          _this.track.style.transform = 'translate3d{0, 0, 0}';
          _this.resized = false;
        }
      }, _this.settings.resizeTimeout);
    });
  };

  Smallee.prototype.changeSlide = function(direction) {
    const _this = this;
    let frame;
    let nextStep;

    switch (direction) {
      case 'next':
        if (this.sliderCoords.wasMovedOn - this.stepRange >= this.scrollLimit) {
          nextStep = this.sliderCoords.wasMovedOn - this.stepRange;
        }
        if (this.sliderCoords.wasMovedOn - this.stepRange < this.scrollLimit) {
          nextStep = this.scrollLimit;
        }
        if (this.settings.loop && this.sliderCoords.wasMovedOn === this.scrollLimit) {
          nextStep = 0;
        }
        break;
      case 'prev':
        if (this.sliderCoords.wasMovedOn + this.stepRange > 0) {
          nextStep = 0;
        }
        if (this.sliderCoords.wasMovedOn + this.stepRange <= 0) {
          nextStep = this.sliderCoords.wasMovedOn + this.stepRange;
        }
        if (this.settings.loop && this.sliderCoords.wasMovedOn === 0) {
          nextStep = this.scrollLimit;
        }
        break;
      default:
        return;
    }

    switch (this.settings.effect) {
      case 'slide':
      default:
        frame = requestAnimationFrame(function() {
          _this.track.style.transform = `translate3d(${nextStep}px, 0, 0)`;
          _this.sliderCoords.wasMovedOn = defineSmalleeWasTranslatedOn.call(_this);
          restoreTransition.call(_this);
          setArrowsState.call(_this);
          cancelAnimationFrame(frame);
        });
    }
  };

  Smallee.prototype.onSlideChange = function(func) {
    func();
  };

  Smallee.prototype.destroy = function() {
    /* TODO */
  };

  return Smallee;
});
