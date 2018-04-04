;(function (root, factory) {
	if(typeof define === 'function' && define.amd) {
		define([], factory(root));
	} else if(typeof exports === 'object') {
		module.exports = factory(root);
	} else {
		root.Smallee = factory(root);
	}
})(typeof global !== 'undefined' ? global : window || this.window || this.global, function (root) {
	'use strict';
	
	window.Smallee = Smallee || {};
	
	const defaultClasses = {
		smallee: 'smallee',
		inner: 'smallee-inner',
		slide: 'smallee-slide',
		prev: 'smallee-prev',
		next: 'smallee-next',
		prevDisabled: 'smallee-prev_disabled',
		nextDisabled: 'smallee-next_disabled'
	};
	
	function Smallee(object) {
		if (object.selector.charAt(0) === '#') {
			this.selector = document.getElementById(object.selector.substr(1));
		}else if (object.selector.charAt(0) === '.') {
			this.selector = document.getElementsByClassName(object.selector.substr(1))[0];
		}else {
			throw new Error('It seems that you forgot css-selectors :-)');
		}
		this.slides = Array.prototype.slice.call(this.selector.children);
		this.numberOfSlides = this.slides.length;
		
		const defaultSettings = {
			controls: false,
			slidesToShow: 1,
			slidesToScroll: 1,
			draggable: false,
			transition: 'ease-in-out .7s',
			threshold: 100
		}

		if (arguments[0] && typeof arguments[0] === 'object') {
			this.settings = setUserSettings(defaultSettings, arguments[0]);
		}

		['nextSlide', 'prevSlide', 'moveSlides', 'mouseDown', 'mouseUp', 'mouseMove', 'mouseLeave', 'preventDragStart'].forEach(method => { this[method] = this[method].bind(this); });

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
		this.scrollLimit = -((this.numberOfSlides - this.settings.slidesToShow) * (this.stepRange / this.settings.slidesToScroll));
		this.sliderCoords = {
			start: null,
			wasMovedOn: null
		};

		if (this.settings.controls) {
			this.setNavigation();
		}
		if (this.settings.draggable) {
			this.isDown = false;
			this.initDragEvents();
		}
	}
	
	Smallee.prototype.setStylesToTheElements = function() {
		const sliderWidth = this.selector.clientWidth;
		
		this.selector.style.overflow = 'hidden';
		this.selector.style.position = 'relative';
		
		this.inner.style.width = `${sliderWidth * this.numberOfSlides / this.settings.slidesToShow}px`;
		this.inner.style.transition = this.settings.transition;
		
		this.slides.forEach(item => {
			item.style.float = 'left';
			item.style.width = `${sliderWidth / this.settings.slidesToShow}px`;
		});
	}

	Smallee.prototype.setControlsState = function() {
		if (this.defineSmalleeWasTranslatedOn() === this.scrollLimit) {
			this.next.classList.add(defaultClasses.nextDisabled);
		}else {
			this.next.classList.remove(defaultClasses.nextDisabled);
		}

		if (this.defineSmalleeWasTranslatedOn() === 0) {
			this.prev.classList.add(defaultClasses.prevDisabled);
		}else {
			this.prev.classList.remove(defaultClasses.prevDisabled);
		}
	}

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
	}

	Smallee.prototype.defineSmalleeWasTranslatedOn = function() {
		const translate = this.inner.style.transform;
		return translate ? Number(translate.slice(translate.indexOf('(') + 1, translate.indexOf('p'))) : 0;
	}

	Smallee.prototype.nextSlide = function(event) {
		const limit = this.scrollLimit;
		const nextStep = this.sliderCoords.wasMovedOn - this.stepRange >= limit ? this.sliderCoords.wasMovedOn - this.stepRange : limit;
		
		this.inner.style.transform = `translate3d(${nextStep}px, 0, 0)`;
		this.setControlsState();
	}

	Smallee.prototype.prevSlide = function(event) {
		const prevStep = this.sliderCoords.wasMovedOn + this.stepRange > 0 ? 0 : this.sliderCoords.wasMovedOn + this.stepRange;
		
		this.inner.style.transform = `translate3d(${prevStep}px, 0, 0)`;
		this.setControlsState();
	}

	Smallee.prototype.clearTransition = function() {
		this.inner.style.transition = '0s';
	}

	Smallee.prototype.restoreTransition = function() {
		this.inner.style.transition = this.settings.transition;
	}

	Smallee.prototype.moveSlides = function() {
		this.sliderCoords.wasMovedOn = this.defineSmalleeWasTranslatedOn();
		if (event.target.closest(`.${defaultClasses.next}`)) {
			this.nextSlide();
		}
		if (event.target.closest(`.${defaultClasses.prev}`)) {
			this.prevSlide();
		}
	}

	Smallee.prototype.initClickEvents = function(event) {
		this.selector.addEventListener('click', this.moveSlides);
	}

	Smallee.prototype.mouseDown = function(event) {
		this.isDown = true;
		this.sliderCoords.start = event.clientX;
		this.sliderCoords.wasMovedOn = this.defineSmalleeWasTranslatedOn();
		this.clearTransition();
	}

	Smallee.prototype.mouseUp = function() {
		this.isDown = false;
		this.restoreTransition();
		if (event.clientX - this.sliderCoords.start < -this.settings.threshold) {
			this.nextSlide();
			return;
		}
		if (event.clientX - this.sliderCoords.start > this.settings.threshold) {
			this.prevSlide();
			return;
		}
		this.inner.style.transform = `translate3d(${this.sliderCoords.wasMovedOn}px, 0, 0)`;
	}

	Smallee.prototype.mouseMove = function(event) {
		if (this.isDown) {
			this.inner.style.transform = `translate3d(${this.sliderCoords.wasMovedOn + event.clientX - this.sliderCoords.start}px, 0, 0)`;
		}
	}
	
	Smallee.prototype.mouseLeave = function() {
		if (this.isDown) {
			this.isDown = false;
			this.restoreTransition();
			if (event.clientX - this.sliderCoords.start < -this.settings.threshold) {
				this.nextSlide();
				return;
			}
			if (event.clientX - this.sliderCoords.start > this.settings.threshold) {
				this.prevSlide();
				return;
			}
			this.inner.style.transform = `translate3d(${this.sliderCoords.wasMovedOn}px, 0, 0)`;
		}
	}

	Smallee.prototype.preventDragStart = function(event) {
		prevDefAndStopProp(event);
	}

	Smallee.prototype.initDragEvents = function() {
		this.inner.addEventListener('mousedown', this.mouseDown);
		this.inner.addEventListener('mouseup', this.mouseUp);
		this.inner.addEventListener('mousemove', this.mouseMove);
		this.inner.addEventListener('mouseleave', this.mouseLeave);
		this.inner.addEventListener('dragstart', this.preventDragStart);
	}

	return Smallee;

});