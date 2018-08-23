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
    arrows: true,
    delay: 300,
    easeFunc: 'ease-in-out', // can be any transition function
    effect: 'slide',
    loop: false,
    onChange: false,
    resizeTimeout: 1000,
    responsive: true,
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

    this.init();
  }

  /**
   * ----- Public methods -----
   */
  Smallee.prototype.init = function() {
    const fragment = build.call(this, this.settings.effect);
    this.selector.appendChild(fragment);
    setData.call(this);

    if (this.settings.arrows) {
      this.bindGetDirection = getDirection.bind(this);
      setArrows.call(this);
      initClickEvents.call(this);
    }

    if (this.settings.swipeable) {
      this.bindMouseDown = mouseDown.bind(this);
      this.bindMouseUp = mouseUp.bind(this);
      this.bindMouseMove = mouseMove.bind(this);
      this.bindMouseLeave = mouseLeave.bind(this);
      this.bindPreventDragStart = preventDragStart.bind(this);
      initSwipeEvents.call(this);
    }

    if (this.settings.responsive) {
      this.bindResizeHandler = resizeHandler.bind(this);
      initResizeEvent.call(this);
    }

    /**
     * It fixes the issue with different selector scrollWidth
     * value because of scrollBar when there is no exact width value
     * for the container of the slider.
     */
    const timer = setTimeout(() => {
      clearTimeout(timer);
      this.refresh();
    }, 10);
  };

  Smallee.prototype.changeSlide = function(direction) {
    const _this = this;
    let frame;
    let nextStep;

    switch (direction) {
      case 'next':
        if (this.instanceData.wasMovedOn - this.stepRange >= this.scrollLimit) {
          nextStep = this.instanceData.wasMovedOn - this.stepRange;
        }
        if (this.instanceData.wasMovedOn - this.stepRange < this.scrollLimit) {
          nextStep = this.scrollLimit;
        }
        if (this.settings.loop && this.instanceData.wasMovedOn === this.scrollLimit) {
          nextStep = 0;
        }
        break;
      case 'prev':
        if (this.instanceData.wasMovedOn + this.stepRange > 0) {
          nextStep = 0;
        }
        if (this.instanceData.wasMovedOn + this.stepRange <= 0) {
          nextStep = this.instanceData.wasMovedOn + this.stepRange;
        }
        if (this.settings.loop && this.instanceData.wasMovedOn === 0) {
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
          _this.instanceData.wasMovedOn = defineSmalleeWasTranslatedOn.call(_this);
          restoreTransition.call(_this);

          if (_this.settings.onChange) {
            const timer = setTimeout(() => {
              clearTimeout(timer);
              _this.onSlideChange(_this.settings.onChange);
            }, _this.settings.delay);
          }

          setArrowsState.call(_this);
          cancelAnimationFrame(frame);
        });
    }
  };

  Smallee.prototype.refresh = function() {
    setData.call(this);
  };

  Smallee.prototype.onSlideChange = function(func) {
    func();
  };

  Smallee.prototype.destroy = function() {
    const slides = Array.prototype.slice.call(this.track.children);

    this.selector.classList.remove('smallee');
    this.selector.removeChild(this.inner);

    if (this.settings.arrows) {
      this.selector.removeChild(this.prev);
      this.selector.removeChild(this.next);
      removeClickEvents.call(this);
    }

    this.settings.swipeable && removeSwipeEvents.call(this);
    this.settings.responsive && removeResizeEvent.call(this);

    slides.forEach(item => {
      item.classList.remove('smallee-slide');
      item.removeAttribute('data-index');
      item.style.removeProperty('width');
      this.selector.appendChild(item);
    });

    return null;
  };

  /**
   * ----- Private methods and utils -----
   */
  const prevDefAndStopProp = function(event) {
    event.preventDefault();
    event.stopPropagation();
  };

  const mergeSettings = function(defaultSettings, userSettings) {
    for (let key in defaultSettings) {
      if (!userSettings[key]) {
        userSettings[key] = defaultSettings[key];
      }
    }
    return userSettings;
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

  const setData = function() {
    this.instanceData = {
      start: null,
      wasMovedOn: 0,
      resized: false
    };

    switch (this.settings.effect) {
      case 'slide':
      default:
        const sliderWidth = this.selector.scrollWidth;

        this.stepRange = (sliderWidth / this.settings.slidesToShow) * this.settings.slidesToScroll;

        this.scrollLimit = -(
          (this.numberOfSlides - this.settings.slidesToShow) *
          (this.stepRange / this.settings.slidesToScroll)
        );

        this.track.style.width = `${(sliderWidth * this.numberOfSlides) / this.settings.slidesToShow}px`;

        this.track.style.transform = 'translate3d(0, 0, 0)';

        this.track.style.transition = this.settings.transition;

        this.slides.forEach(item => {
          item.style.width = `${sliderWidth / this.settings.slidesToShow}px`;
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

    if (this.instanceData.wasMovedOn === this.scrollLimit) {
      this.next.classList.add(classes.nextDisabled);
    } else {
      this.next.classList.remove(classes.nextDisabled);
    }

    if (this.instanceData.wasMovedOn === 0) {
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

  const mouseDown = function(event) {
    this.isDown = true;
    this.instanceData.start = event.clientX;
    clearTransition.call(this);
  };

  const mouseUp = function() {
    this.isDown = false;

    if (event.clientX - this.instanceData.start < -this.settings.threshold) {
      this.changeSlide('next');
      return;
    }

    if (event.clientX - this.instanceData.start > this.settings.threshold) {
      this.changeSlide('prev');
      return;
    }

    restoreTransition.call(this);
    this.track.style.transform = `translate3d(${this.instanceData.wasMovedOn}px, 0, 0)`;
  };

  const mouseMove = function(event) {
    if (this.isDown && this.settings.effect !== 'fade') {
      this.track.style.transform = `translate3d(${this.instanceData.wasMovedOn +
        event.clientX -
        this.instanceData.start}px, 0, 0)`;
    }
  };

  const mouseLeave = function() {
    if (this.isDown) {
      this.isDown = false;
      restoreTransition.call(this);
      if (event.clientX - this.instanceData.start < -this.settings.threshold) {
        this.changeSlide('next');
        return;
      }
      if (event.clientX - this.instanceData.start > this.settings.threshold) {
        this.changeSlide('prev');
        return;
      }
      this.track.style.transform = `translate3d(${this.instanceData.wasMovedOn}px, 0, 0)`;
    }
  };

  const resizeHandler = function() {
    this.instanceData.resized = true;
    const timer = setTimeout(() => {
      if (this.instanceData.resized) {
        clearTimeout(timer);
        this.refresh();
        this.instanceData.resized = false;
      }
    }, this.settings.resizeTimeout);
  };

  const preventDragStart = function(event) {
    prevDefAndStopProp(event);
  };

  /**
   * Events
   */
  const initClickEvents = function() {
    this.selector.addEventListener('click', this.bindGetDirection);
  };

  const removeClickEvents = function() {
    this.selector.removeEventListener('click', this.bindGetDirection);
  };

  const initSwipeEvents = function() {
    this.selector.addEventListener('mousedown', this.bindMouseDown);
    this.selector.addEventListener('mouseup', this.bindMouseUp);
    this.selector.addEventListener('mousemove', this.bindMouseMove);
    this.selector.addEventListener('mouseleave', this.bindMouseLeave);
    this.selector.addEventListener('dragstart', this.bindPreventDragStart);
  };

  const removeSwipeEvents = function() {
    this.selector.removeEventListener('mousedown', this.bindMouseDown);
    this.selector.removeEventListener('mouseup', this.bindMouseUp);
    this.selector.removeEventListener('mousemove', this.bindMouseMove);
    this.selector.removeEventListener('mouseleave', this.bindMouseLeave);
    this.selector.removeEventListener('dragstart', this.bindPreventDragStart);
  };

  const initResizeEvent = function() {
    window.addEventListener('resize', this.bindResizeHandler);
  };

  const removeResizeEvent = function() {
    window.removeEventListener('resize', this.bindResizeHandler);
  };

  return Smallee;
});
