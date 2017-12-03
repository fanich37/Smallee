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
	
	const defaultClassess = {
		smallee: 'smallee',
		inner: 'smallee-inner',
		slide: 'smallee-slide',
		prev: 'smallee-prev',
		next: 'smallee-next',
		prevDisabled: 'smallee-prev_disabled',
		nextDisabled: 'smallee-next_disabled'
	};
	
	function Smallee(object) {
		if (object.selector[0] === '#') {
			this.selector = document.getElementById(object.selector.substr(1));
		}else if (object.selector[0] === '.') {
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

		init.call(this);
		if (this.settings.controls) {
			setNavigation.call(this);
		}
		if (this.settings.draggable) {
			initDragEvents.call(this);
		}
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
	
	function init() {
		const _this = this;
		const fragment = document.createDocumentFragment();

		this.selector.classList.add(defaultClassess.smallee);

		this.inner = document.createElement('DIV');
		this.inner.classList.add(defaultClassess.inner);
		this.slides.forEach((item, i) => {
			item.setAttribute('data-index', i);
			this.inner.appendChild(item);
		});

		fragment.appendChild(this.inner);

		this.selector.appendChild(fragment);
		this.setStylesToTheElements();
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
			this.next.classList.add(defaultClassess.nextDisabled);
		}else {
			this.next.classList.remove(defaultClassess.nextDisabled);
		}

		if (this.defineSmalleeWasTranslatedOn() === 0) {
			this.prev.classList.add(defaultClassess.prevDisabled);
		}else {
			this.prev.classList.remove(defaultClassess.prevDisabled);
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

	Smallee.prototype.moveSlides = function(event) {
		const stepRange = this.defineTheStepRange();
		const wasMovedOn = this.defineSmalleeWasTranslatedOn();
		const limit = this.defineTheLimit();
		
		const nextStep = wasMovedOn - stepRange >= limit ? wasMovedOn - stepRange : limit;
		const prevStep = wasMovedOn + stepRange > 0 ? 0 : wasMovedOn + stepRange;
		
		if (event.target.className === 'smallee-next') {
			this.inner.style.transform = `translate3d(${nextStep}px, 0, 0)`;
			this.setControlsState();
		}
		if (event.target.className === 'smallee-prev') {
			this.inner.style.transform = `translate3d(${prevStep}px, 0, 0)`;
			this.setControlsState();
		}
	}

	Smallee.prototype.dragSlides = function(isDown, isMoving, startPoint) {
		const stepRange = this.defineTheStepRange();
		const wasMovedOn = this.defineSmalleeWasTranslatedOn();
		const limit = this.defineTheLimit();

		if (isDown && isMoving) {
			if (event.clientX < startPoint) {
				const nextStep = wasMovedOn + (event.clientX - startPoint);
				console.log(nextStep);
				// this.inner.style.transform = `translate3d(${nextStep}px, 0, 0)`;
				// this.setControlsState();
			}else {
				const nextStep = wasMovedOn - (startPoint - event.clientX);
			}
		}
	}

	function setNavigation() {
		this.prev = document.createElement('BUTTON');
		this.prev.href = '/';
		this.prev.classList.add('smallee-prev');

		this.next = document.createElement('BUTTON');
		this.next.href = '/';
		this.next.classList.add('smallee-next');

		this.selector.appendChild(this.prev);
		this.selector.appendChild(this.next);

		initMainEvents.call(this);
		this.setControlsState();
	}

	function initMainEvents() {
		const _this = this;
		
		this.prev.addEventListener('click', function (event) {
			prevDefAndStopProp(event);
			_this.moveSlides(event);
		});
		this.next.addEventListener('click', function (event) {
			prevDefAndStopProp(event);
			_this.moveSlides(event);
		});
	}

	function initDragEvents() {
		const _this = this;
		let isDown = false;
		let isMoving = false;
		let startPoint = 0;
		
		this.inner.addEventListener('mousedown', function (event) {
			isDown = true;
			startPoint = event.clientX;
			_this.dragSlides(isDown, isMoving, event.clientX);
		});

		this.inner.addEventListener('mousemove', function () {
			isMoving = true;
			_this.dragSlides(isDown, isMoving, startPoint);
		});

		this.inner.addEventListener('mouseup', function () {
			isDown = false;
			isMoving = false;
			_this.dragSlides(isDown, isMoving);
		});
	}

	return Smallee;

});