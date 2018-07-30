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
    loop: false,
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

    init(this);
  }

  function prevDefAndStopProp(event) {
    event.preventDefault();
    event.stopPropagation();
  }

  function mergeSettings(defaultSettings, userSettings) {
    return Object.assign({}, defaultSettings, userSettings);
  }

  const init = function(instance) {
    const fragment = document.createDocumentFragment();
    instance.sliderCoords = {
      start: null,
      wasMovedOn: 0
    };

    instance.selector.classList.add(classes.smallee);

    instance.inner = document.createElement('DIV');
    instance.inner.classList.add(classes.inner);

    instance.track = document.createElement('DIV');
    instance.track.classList.add(classes.track);
    instance.slides.forEach((item, i) => {
      item.setAttribute('data-index', i);
      instance.track.appendChild(item);
    });

    instance.inner.appendChild(instance.track);

    fragment.appendChild(instance.inner);

    instance.selector.appendChild(fragment);
    setDimensions(instance);
    instance.stepRange =
      (instance.selector.clientWidth / instance.settings.slidesToShow) * instance.settings.slidesToScroll;
    instance.scrollLimit = -(
      (instance.numberOfSlides - instance.settings.slidesToShow) *
      (instance.stepRange / instance.settings.slidesToScroll)
    );

    if (instance.settings.arrows) {
      setArrows(instance);
    }
    if (instance.settings.swipeable) {
      instance.isDown = false;
      initSwipeEvents(instance);
    }
    // if (this.settings.responsive) {
    //   this.resizeHandler();
    // }
  };

  const setDimensions = function(instance) {
    const sliderWidth = instance.selector.clientWidth;

    instance.track.style.width = `${(sliderWidth * instance.numberOfSlides) / instance.settings.slidesToShow}px`;
    switch (instance.settings.effect) {
      case 'fade':
        instance.slides.forEach(slide => {
          slide.style.transition = instance.settings.transition;
        });
        break;
      default:
        instance.track.style.transition = instance.settings.transition;
    }

    instance.slides.forEach(item => {
      item.style.float = 'left';
      item.style.width = `${sliderWidth / instance.settings.slidesToShow}px`;
    });
  };

  const setArrows = function(instance) {
    instance.prev = document.createElement('BUTTON');
    instance.prev.type = 'button';
    instance.prev.classList.add(classes.prev);

    instance.next = document.createElement('BUTTON');
    instance.next.type = 'button';
    instance.next.classList.add(classes.next);

    instance.selector.appendChild(instance.prev);
    instance.selector.appendChild(instance.next);

    initClickEvents(instance);
    setArrowsState(instance);
  };

  const setArrowsState = function(instance) {
    if (!instance.settings.arrows || instance.settings.loop) return;
    if (instance.sliderCoords.wasMovedOn === instance.scrollLimit) {
      instance.next.classList.add(classes.nextDisabled);
    } else {
      instance.next.classList.remove(classes.nextDisabled);
    }

    if (instance.sliderCoords.wasMovedOn === 0) {
      instance.prev.classList.add(classes.prevDisabled);
    } else {
      instance.prev.classList.remove(classes.prevDisabled);
    }
  };

  const defineSmalleeWasTranslatedOn = function(instance) {
    const translate = instance.track.style.transform;
    return translate ? Number(translate.slice(translate.indexOf('(') + 1, translate.indexOf('p'))) : 0;
  };

  const clearTransition = function(instance) {
    instance.track.style.transition = '0s';
  };

  const restoreTransition = function(instance) {
    instance.track.style.transition = instance.settings.transition;
  };

  const getDirection = function() {
    if (event.target.closest(`.${classes.next}`)) {
      this.changeSlide('next');
    }
    if (event.target.closest(`.${classes.prev}`)) {
      this.changeSlide('prev');
    }
  };

  const initClickEvents = function(instance) {
    const bindGetDirection = getDirection.bind(instance);
    instance.selector.addEventListener('click', bindGetDirection);
  };

  const mouseDown = function(event) {
    this.isDown = true;
    this.sliderCoords.start = event.clientX;
    clearTransition(this);
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
    restoreTransition(this);
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
      restoreTransition(this);
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

  const initSwipeEvents = function(instance) {
    const bindMouseDown = mouseDown.bind(instance);
    const bindMouseUp = mouseUp.bind(instance);
    const bindMouseMove = mouseMove.bind(instance);
    const bindMouseLeave = mouseLeave.bind(instance);
    const bindPreventDragStart = preventDragStart.bind(instance);

    instance.track.addEventListener('mousedown', bindMouseDown);
    instance.track.addEventListener('mouseup', bindMouseUp);
    instance.track.addEventListener('mousemove', bindMouseMove);
    instance.track.addEventListener('mouseleave', bindMouseLeave);
    instance.track.addEventListener('dragstart', bindPreventDragStart);
  };

  Smallee.prototype.changeSlide = function(direction) {
    const _this = this;
    let frame;
    let nextStep;

    switch (direction) {
      case 'next':
        console.log(this.sliderCoords.wasMovedOn, this.stepRange, this.scrollLimit);
        // let nextStep;
        if (this.sliderCoords.wasMovedOn - this.stepRange >= this.scrollLimit) {
          nextStep = this.sliderCoords.wasMovedOn - this.stepRange;
        } else {
          nextStep = this.scrollLimit;
        }
        if (this.sliderCoords.wasMovedOn === this.scrollLimit) {
          nextStep = 0;
        }
        // this.sliderCoords.wasMovedOn - this.stepRange >= this.scrollLimit
        //   ? this.sliderCoords.wasMovedOn - this.stepRange
        //   : this.scrollLimit;
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
            _this.sliderCoords.wasMovedOn = defineSmalleeWasTranslatedOn(_this);
            setArrowsState(_this);
            window.cancelAnimationFrame(frame);
          });
          clearInterval(timer);
        }, this.settings.delay);
        break;
      default:
        frame = requestAnimationFrame(function() {
          _this.track.style.transform = `translate3d(${nextStep}px, 0, 0)`;
          _this.sliderCoords.wasMovedOn = defineSmalleeWasTranslatedOn(_this);
          restoreTransition(_this);
          setArrowsState(_this);
          window.cancelAnimationFrame(frame);
        });
    }
  };

  Smallee.prototype.doOnResize = function(mediaQueryList) {
    /* TODO */
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
    /* TODO */
    const mql = {};
    for (const breakpoint in this.settings.responsive) {
      mql[breakpoint] = window.matchMedia(`(max-width: ${breakpoint}px)`);
      mql[breakpoint].addListener(this.doOnResize);
    }
  };

  Smallee.prototype.onSlideChange = function() {
    /* TODO */
  };

  return Smallee;
});
