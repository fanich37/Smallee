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
			transition: 'ease-in-out .3s'
		}

		if (arguments[0] && typeof arguments[0] === 'object') {
			this.settings = setUserSettings(defaultSettings, arguments[0]);
		}

		['moveSlides', 'mouseDown', 'mouseUp', 'mouseMove', 'preventClick'].forEach(method => { this[method] = this[method].bind(this); });

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
		const _this = this;
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

		if (this.settings.controls) {
			this.setNavigation();
		}
		if (this.settings.draggable) {
			this.isDown = false;
			this.dragCoords = {
				start: null,
				wasMovedOn: null
			};
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
		if (this.defineSmalleeWasTranslatedOn() === this.defineTheLimit()) {
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

	Smallee.prototype.defineTheStepRange = function() {
		return (this.selector.clientWidth / this.settings.slidesToShow) * this.settings.slidesToScroll;
	}

	Smallee.prototype.defineTheLimit = function() {
		return -((this.numberOfSlides - this.settings.slidesToShow) * (this.defineTheStepRange() / this.settings.slidesToScroll));
	}

	Smallee.prototype.defineSmalleeWasTranslatedOn = function() {
		const translate = this.inner.style.transform;
		return translate ? Number(translate.slice(translate.indexOf('(') + 1, translate.indexOf('p'))) : 0;
	}

	Smallee.prototype.nextSlide = function(event) {
		const stepRange = this.defineTheStepRange();
		const wasMovedOn = this.defineSmalleeWasTranslatedOn();
		const limit = this.defineTheLimit();
		const nextStep = wasMovedOn - stepRange >= limit ? wasMovedOn - stepRange : limit;
		
		this.inner.style.transform = `translate3d(${nextStep}px, 0, 0)`;
		this.setControlsState();
	}

	Smallee.prototype.prevSlide = function(event) {
		const stepRange = this.defineTheStepRange();
		const wasMovedOn = this.defineSmalleeWasTranslatedOn();
		const limit = this.defineTheLimit();
		const prevStep = wasMovedOn + stepRange > 0 ? 0 : wasMovedOn + stepRange;
		
		this.inner.style.transform = `translate3d(${prevStep}px, 0, 0)`;
		this.setControlsState();
	}

	Smallee.prototype.clearTransition = function() {
		this.inner.style.transition = '0s';
	}

	Smallee.prototype.restoreTransition = function() {
		this.inner.style.transition = this.settings.transition;
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

	Smallee.prototype.moveSlides = function() {
		if (event.target.closest(defaultClasses.next)) {
			this.nextSlide();
		}
		if (event.target.closest(defaultClasses.prev)) {
			this.prevSlide();
		}
	}

	Smallee.prototype.preventClick = function(event) {
		if (event.target.closest('a')) {
			prevDefAndStopProp(event);
		}
	}

	Smallee.prototype.initClickEvents = function(event) {
		this.selector.addEventListener('click', this.moveSlides);
	}

	Smallee.prototype.setInnerInProperPositionAfterDrag = function() {

	}

	Smallee.prototype.mouseDown = function(event) {
		this.isDown = true;
		this.dragCoords.start = event.clientX;
		this.dragCoords.wasMovedOn = this.defineSmalleeWasTranslatedOn();
		this.clearTransition();
	}

	Smallee.prototype.mouseUp = function() {
		this.isDown = false;
		this.dragCoords.start = null;
		this.dragCoords.wasMovedOn = null;
		this.restoreTransition();
	}

	Smallee.prototype.mouseMove = function(event) {
		if (this.isDown) {
			this.inner.style.transform = `translate3d(${this.dragCoords.wasMovedOn + event.clientX - this.dragCoords.start}px, 0, 0)`;
		}
	}
	
	Smallee.prototype.initDragEvents = function() {
		this.inner.addEventListener('mousedown', this.mouseDown);
		this.inner.addEventListener('mouseup', this.mouseUp);
		this.inner.addEventListener('mousemove', this.mouseMove);
	}

	return Smallee;

});