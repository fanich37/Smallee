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

  const classes = {
    smallee: 'smallee',
    inner: 'smallee-inner',
    track: 'smallee-track',
    slide: 'smallee-slide',
    prev: 'smallee-prev',
    next: 'smallee-next',
    prevDisabled: 'smallee-prev_disabled',
    nextDisabled: 'smallee-next_disabled'
  };

  const defaultSettings = {
    controls: false,
    delay: 300,
    easeFunc: 'ease-in-out', // can be any transition function
    effect: 'default', // also 'fade' is available
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

  window.requestAnimationFrame = requestAnimationFrame;
  window.Smallee = Smallee || {};

  function Smallee(settings) {
    if (typeof settings !== 'object' || typeof settings.selector === 'undefined') {
      console.log('🚫 Something went wrong. Please check the doc for any mistakes in config.');
      return;
    }

    this.selector = document.querySelector(settings.selector);
    this.slides = Array.from(this.selector.children);
    this.numberOfSlides = this.slides.length;
    this.settings = mergeSettings(defaultSettings, settings);
    this.settings.transition = `${this.settings.easeFunc} ${this.settings.delay}ms`;

    [
      'changeSlide',
      'getDirection',
      'mouseDown',
      'mouseUp',
      'mouseMove',
      'mouseLeave',
      'preventDragStart',
      'doOnResize'
    ].forEach(method => {
      this[method] = this[method].bind(this);
    });

    this.init();
  }

  function prevDefAndStopProp(event) {
    event.preventDefault();
    event.stopPropagation();
  }

  function mergeSettings(defaultSettings, userSettings) {
    return Object.assign({}, defaultSettings, userSettings);
  }

  Smallee.prototype.init = function() {
    const fragment = document.createDocumentFragment();
    this.sliderCoords = {
      start: null,
      wasMovedOn: 0
    };

    this.selector.classList.add(classes.smallee);

    this.inner = document.createElement('DIV');
    this.inner.classList.add(classes.inner);

    this.track = document.createElement('DIV');
    this.track.classList.add(classes.track);
    this.slides.forEach((item, i) => {
      item.setAttribute('data-index', i);
      this.track.appendChild(item);
    });

    this.inner.appendChild(this.track);

    fragment.appendChild(this.inner);

    this.selector.appendChild(fragment);
    this.setDimensions();
    this.stepRange = (this.selector.clientWidth / this.settings.slidesToShow) * this.settings.slidesToScroll;
    this.scrollLimit = -(
      (this.numberOfSlides - this.settings.slidesToShow) *
      (this.stepRange / this.settings.slidesToScroll)
    );

    if (this.settings.arrows) {
      this.setArrows();
    }
    if (this.settings.swipeable) {
      this.isDown = false;
      this.initSwipeEvents();
    }
    // if (this.settings.responsive) {
    //   this.resizeHandler();
    // }
  };

  Smallee.prototype.doOnResize = function(mediaQueryList) {
    if (mediaQueryList.matches) {
      const sliderWidth = this.selector.clientWidth;

      this.stepRange =
        (this.selector.clientWidth /
          this.settings.responsive[Number(mediaQueryList.media.match(/[0-9]/g).join(''))].slidesToShow) *
        this.settings.slidesToScroll;

      this.scrollLimit = -(
        (this.numberOfSlides - this.settings.slidesToShow) *
        (this.stepRange / this.settings.slidesToScroll)
      );

      this.track.style.width = `${(sliderWidth * this.numberOfSlides) /
        this.settings.responsive[Number(mediaQueryList.media.match(/[0-9]/g).join(''))].slidesToShow}px`;

      this.slides.forEach(item => {
        item.style.width = `${sliderWidth /
          this.settings.responsive[Number(mediaQueryList.media.match(/[0-9]/g).join(''))].slidesToShow}px`;
      });
    }
  };

  Smallee.prototype.resizeHandler = function() {
    const mql = {};
    for (const breakpoint in this.settings.responsive) {
      mql[breakpoint] = window.matchMedia(`(max-width: ${breakpoint}px)`);
      mql[breakpoint].addListener(this.doOnResize);
    }
  };

  Smallee.prototype.setDimensions = function() {
    const sliderWidth = this.selector.clientWidth;

    this.track.style.width = `${(sliderWidth * this.numberOfSlides) / this.settings.slidesToShow}px`;
    switch (this.settings.effect) {
      case 'fade':
        this.slides.forEach(slide => {
          slide.style.transition = this.settings.transition;
        });
        break;
      default:
        this.track.style.transition = this.settings.transition;
    }

    this.slides.forEach(item => {
      item.style.float = 'left';
      item.style.width = `${sliderWidth / this.settings.slidesToShow}px`;
    });
  };

  Smallee.prototype.setArrows = function() {
    this.prev = document.createElement('BUTTON');
    this.prev.type = 'button';
    this.prev.classList.add(classes.prev);

    this.next = document.createElement('BUTTON');
    this.next.type = 'button';
    this.next.classList.add(classes.next);

    this.selector.appendChild(this.prev);
    this.selector.appendChild(this.next);

    this.initClickEvents();
    this.setArrowsState();
  };

  Smallee.prototype.setArrowsState = function() {
    if (!this.settings.arrows) return;
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

  Smallee.prototype.defineSmalleeWasTranslatedOn = function() {
    const translate = this.track.style.transform;
    return translate ? Number(translate.slice(translate.indexOf('(') + 1, translate.indexOf('p'))) : 0;
  };

  Smallee.prototype.changeSlide = function(direction) {
    const _this = this;
    let frame;
    let nextStep;

    switch (direction) {
      case 'next':
        nextStep =
          this.sliderCoords.wasMovedOn - this.stepRange >= this.scrollLimit
            ? this.sliderCoords.wasMovedOn - this.stepRange
            : this.scrollLimit;
        break;
      case 'prev':
        nextStep =
          this.sliderCoords.wasMovedOn + this.stepRange > 0 ? 0 : this.sliderCoords.wasMovedOn + this.stepRange;
        break;
      default:
        return;
    }

    switch (this.settings.effect) {
      case 'fade':
        this.slides.forEach(item => {
          item.style.opacity = 0;
        });

        const timer = setTimeout(function() {
          frame = requestAnimationFrame(function() {
            _this.track.style.transform = `translate3d(${nextStep}px, 0, 0)`;
            _this.slides.forEach(item => {
              item.style.opacity = 1;
            });
            _this.sliderCoords.wasMovedOn = _this.defineSmalleeWasTranslatedOn();
            _this.setArrowsState();
            window.cancelAnimationFrame(frame);
          });
          clearInterval(timer);
        }, this.settings.delay);
        break;
      default:
        frame = requestAnimationFrame(function() {
          _this.track.style.transform = `translate3d(${nextStep}px, 0, 0)`;
          _this.sliderCoords.wasMovedOn = _this.defineSmalleeWasTranslatedOn();
          _this.restoreTransition();
          _this.setArrowsState();
          window.cancelAnimationFrame(frame);
        });
    }
  };

  Smallee.prototype.clearTransition = function() {
    this.track.style.transition = '0s';
  };

  Smallee.prototype.restoreTransition = function() {
    this.track.style.transition = this.settings.transition;
  };

  Smallee.prototype.getDirection = function() {
    if (event.target.closest(`.${classes.next}`)) {
      this.changeSlide('next');
    }
    if (event.target.closest(`.${classes.prev}`)) {
      this.changeSlide('prev');
    }
  };

  Smallee.prototype.initClickEvents = function(event) {
    this.selector.addEventListener('click', this.getDirection);
  };

  Smallee.prototype.mouseDown = function(event) {
    this.isDown = true;
    this.sliderCoords.start = event.clientX;
    this.clearTransition();
  };

  Smallee.prototype.mouseUp = function() {
    this.isDown = false;
    if (event.clientX - this.sliderCoords.start < -this.settings.threshold) {
      this.changeSlide('next');
      return;
    }
    if (event.clientX - this.sliderCoords.start > this.settings.threshold) {
      this.changeSlide('prev');
      return;
    }
    this.restoreTransition();
    this.track.style.transform = `translate3d(${this.sliderCoords.wasMovedOn}px, 0, 0)`;
  };

  Smallee.prototype.mouseMove = function(event) {
    if (this.isDown && this.settings.effect !== 'fade') {
      this.track.style.transform = `translate3d(${this.sliderCoords.wasMovedOn +
        event.clientX -
        this.sliderCoords.start}px, 0, 0)`;
    }
  };

  Smallee.prototype.mouseLeave = function() {
    if (this.isDown) {
      this.isDown = false;
      this.restoreTransition();
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

  Smallee.prototype.preventDragStart = function(event) {
    prevDefAndStopProp(event);
  };

  Smallee.prototype.initSwipeEvents = function() {
    this.track.addEventListener('mousedown', this.mouseDown);
    this.track.addEventListener('mouseup', this.mouseUp);
    this.track.addEventListener('mousemove', this.mouseMove);
    this.track.addEventListener('mouseleave', this.mouseLeave);
    this.track.addEventListener('dragstart', this.preventDragStart);
  };

  return Smallee;
});
