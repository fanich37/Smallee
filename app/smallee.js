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
		slide: 'smallee-slide'
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
			transition: 'ease-in-out .3s'
		}

		if (arguments[0] && typeof arguments[0] === 'object') {
			this.settings = setUserSettings(defaultSettings, arguments[0]);
		}

		init.call(this);
		if (this.settings.controls) {
			this.setNavigation();
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
		this.slides.forEach(item => {
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
	
	Smallee.prototype.setNavigation = function() {
		this.prev = document.createElement('A');
		this.prev.href = '/';
		this.prev.classList.add('smallee-prev');

		this.next = document.createElement('A');
		this.next.href = '/';
		this.next.classList.add('smallee-next');

		this.selector.appendChild(this.prev);
		this.selector.appendChild(this.next);

		initEvents.call(this);
	}

	Smallee.prototype.moveSlides = function(event) {
		const translate = this.inner.style.transform;
		this.stepRange = this.selector.clientWidth / this.settings.slidesToShow;
		this.wasMovedOn = translate ? Number(translate.slice(translate.indexOf('(') + 1, translate.indexOf('p'))) : 0;
		
		this.limit = -((this.numberOfSlides - this.settings.slidesToShow) * this.stepRange);
		
		this.nextStep = this.wasMovedOn - this.stepRange >= this.limit ? this.wasMovedOn - this.stepRange : this.limit;
		this.prevStep = this.wasMovedOn + this.stepRange > 0 ? 0 : this.wasMovedOn + this.stepRange;
		
		if (event.target.className === 'smallee-next') {
			this.inner.style.transform = `translate3d(${this.nextStep}px, 0, 0)`;
		}
		if (event.target.className === 'smallee-prev') {
			this.inner.style.transform = `translate3d(${this.prevStep}px, 0, 0)`;
		}
	}

	function initEvents() {
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

	return Smallee;

});