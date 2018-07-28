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

	const defaultClasses = {
		smallee: 'smallee',
		inner: 'smallee-inner',
		slide: 'smallee-slide',
		prev: 'smallee-prev',
		next: 'smallee-next',
		prevDisabled: 'smallee-prev_disabled',
		nextDisabled: 'smallee-next_disabled'
	};
	const requestAnimationFrame =
		window.requestAnimationFrame ||
		window.mozRequestAnimationFrame ||
		window.webkitRequestAnimationFrame ||
		window.msRequestAnimationFrame;

	window.requestAnimationFrame = requestAnimationFrame;
	window.Smallee = Smallee || {};

	function Smallee(object) {
		const defaultSettings = {
			controls: false,
			slidesToShow: 1,
			slidesToScroll: 1,
			effect: 'default', // also 'fade' is available
			swipeable: false,
			easeFunc: 'ease-in-out', // can be any transition function
			delay: 300,
			threshold: 100,
			responsive: false
		};

		if (typeof object === 'object' && Number(object) !== 0) {
			this.selector = document.querySelector(object.selector);
			this.slides = Array.prototype.slice.call(this.selector.children);
			this.numberOfSlides = this.slides.length;
			this.settings = setUserSettings(defaultSettings, object);
		} else {
			throw new Error('You must pass the object as an argument!');
		}

		this.settings.transition = `${this.settings.easeFunc} .${this.settings.delay / 100}s`;

		[
			'changeSlidesPosition',
			'getDirectionToSlide',
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

	function setUserSettings(def, args) {
		for (let propertyName in args) {
			if (args.hasOwnProperty(propertyName)) {
				def[propertyName] = args[propertyName];
			}
		}
		return def;
	}

	Smallee.prototype.init = function() {
		const fragment = document.createDocumentFragment();
		this.sliderCoords = {
			start: null,
			wasMovedOn: 0
		};

		this.selector.classList.add(defaultClasses.smallee);

		this.inner = document.createElement('DIV');
		this.inner.classList.add(defaultClasses.inner);
		this.slides.forEach((item, i) => {
			item.setAttribute('data-index', i);
			this.inner.appendChild(item);
		});

		fragment.appendChild(this.inner);

		this.selector.appendChild(fragment);
		this.setStylesToTheElements();
		this.stepRange = (this.selector.clientWidth / this.settings.slidesToShow) * this.settings.slidesToScroll;
		this.scrollLimit = -(
			(this.numberOfSlides - this.settings.slidesToShow) *
			(this.stepRange / this.settings.slidesToScroll)
		);

		if (this.settings.controls) {
			this.setNavigation();
		}
		if (this.settings.swipeable) {
			this.isDown = false;
			this.initSwipeEvents();
		}
		if (this.settings.responsive) {
			this.resizeHandler();
		}
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
			this.inner.style.width = `${(sliderWidth * this.numberOfSlides) /
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

	Smallee.prototype.setStylesToTheElements = function() {
		const sliderWidth = this.selector.clientWidth;

		this.selector.style.overflow = 'hidden';
		this.selector.style.position = 'relative';

		this.inner.style.width = `${(sliderWidth * this.numberOfSlides) / this.settings.slidesToShow}px`;
		switch (this.settings.effect) {
			case 'fade':
				this.slides.forEach((item, i) => {
					item.style.transition = this.settings.transition;
				});
				break;
			default:
				this.inner.style.transition = this.settings.transition;
		}

		this.slides.forEach(item => {
			item.style.float = 'left';
			item.style.width = `${sliderWidth / this.settings.slidesToShow}px`;
		});
	};

	Smallee.prototype.setNavigation = function() {
		this.prev = document.createElement('BUTTON');
		this.prev.type = 'button';
		this.prev.classList.add(defaultClasses.prev);

		this.next = document.createElement('BUTTON');
		this.next.type = 'button';
		this.next.classList.add(defaultClasses.next);

		this.selector.appendChild(this.prev);
		this.selector.appendChild(this.next);

		this.initClickEvents();
		this.setControlsState();
	};

	Smallee.prototype.setControlsState = function() {
		if (!this.settings.controls) return;
		if (this.sliderCoords.wasMovedOn === this.scrollLimit) {
			this.next.classList.add(defaultClasses.nextDisabled);
		} else {
			this.next.classList.remove(defaultClasses.nextDisabled);
		}

		if (this.sliderCoords.wasMovedOn === 0) {
			this.prev.classList.add(defaultClasses.prevDisabled);
		} else {
			this.prev.classList.remove(defaultClasses.prevDisabled);
		}
	};

	Smallee.prototype.defineSmalleeWasTranslatedOn = function() {
		const translate = this.inner.style.transform;
		return translate ? Number(translate.slice(translate.indexOf('(') + 1, translate.indexOf('p'))) : 0;
	};

	Smallee.prototype.changeSlidesPosition = function(direction) {
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
						_this.inner.style.transform = `translate3d(${nextStep}px, 0, 0)`;
						_this.slides.forEach(item => {
							item.style.opacity = 1;
						});
						_this.sliderCoords.wasMovedOn = _this.defineSmalleeWasTranslatedOn();
						_this.setControlsState();
						window.cancelAnimationFrame(frame);
					});
					clearInterval(timer);
				}, this.settings.delay);
				break;
			default:
				frame = requestAnimationFrame(function() {
					_this.inner.style.transform = `translate3d(${nextStep}px, 0, 0)`;
					_this.sliderCoords.wasMovedOn = _this.defineSmalleeWasTranslatedOn();
					_this.restoreTransition();
					_this.setControlsState();
					window.cancelAnimationFrame(frame);
				});
		}
	};

	Smallee.prototype.clearTransition = function() {
		this.inner.style.transition = '0s';
	};

	Smallee.prototype.restoreTransition = function() {
		this.inner.style.transition = this.settings.transition;
	};

	Smallee.prototype.getDirectionToSlide = function() {
		if (event.target.closest(`.${defaultClasses.next}`)) {
			this.changeSlidesPosition('next');
		}
		if (event.target.closest(`.${defaultClasses.prev}`)) {
			this.changeSlidesPosition('prev');
		}
	};

	Smallee.prototype.initClickEvents = function(event) {
		this.selector.addEventListener('click', this.getDirectionToSlide);
	};

	Smallee.prototype.mouseDown = function(event) {
		this.isDown = true;
		this.sliderCoords.start = event.clientX;
		this.clearTransition();
	};

	Smallee.prototype.mouseUp = function() {
		this.isDown = false;
		if (event.clientX - this.sliderCoords.start < -this.settings.threshold) {
			this.changeSlidesPosition('next');
			return;
		}
		if (event.clientX - this.sliderCoords.start > this.settings.threshold) {
			this.changeSlidesPosition('prev');
			return;
		}
		this.restoreTransition();
		this.inner.style.transform = `translate3d(${this.sliderCoords.wasMovedOn}px, 0, 0)`;
	};

	Smallee.prototype.mouseMove = function(event) {
		if (this.isDown && this.settings.effect !== 'fade') {
			this.inner.style.transform = `translate3d(${this.sliderCoords.wasMovedOn +
				event.clientX -
				this.sliderCoords.start}px, 0, 0)`;
		}
	};

	Smallee.prototype.mouseLeave = function() {
		if (this.isDown) {
			this.isDown = false;
			this.restoreTransition();
			if (event.clientX - this.sliderCoords.start < -this.settings.threshold) {
				this.changeSlidesPosition('next');
				return;
			}
			if (event.clientX - this.sliderCoords.start > this.settings.threshold) {
				this.changeSlidesPosition('prev');
				return;
			}
			this.inner.style.transform = `translate3d(${this.sliderCoords.wasMovedOn}px, 0, 0)`;
		}
	};

	Smallee.prototype.preventDragStart = function(event) {
		prevDefAndStopProp(event);
	};

	Smallee.prototype.initSwipeEvents = function() {
		this.inner.addEventListener('mousedown', this.mouseDown);
		this.inner.addEventListener('mouseup', this.mouseUp);
		this.inner.addEventListener('mousemove', this.mouseMove);
		this.inner.addEventListener('mouseleave', this.mouseLeave);
		this.inner.addEventListener('dragstart', this.preventDragStart);
	};

	return Smallee;
});
