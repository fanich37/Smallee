;(function () {
	'use strict';
	
	window.Smallee = Smallee || {};
	
	const defaultClassess = {
		smallee: 'smallee',
		slider: 'smallee-slider',
		outer: 'smallee-outer',
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
			slidesToShow: 1
		}

		if (arguments[0] && typeof arguments[0] === 'object') {
			this.settings = setUserSettings(defaultSettings, arguments[0]);
		}

		init.call(this);
		if (this.settings.controls) {
			setNavigation.call(this);
		}
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

		this.slider = document.createElement('DIV');
		this.slider.classList.add(defaultClassess.slider);

		this.inner = document.createElement('DIV');
		this.inner.classList.add(defaultClassess.inner);
		this.slides.forEach(item => {
			this.inner.appendChild(item);
		});

		this.slider.appendChild(this.inner);
		fragment.appendChild(this.slider);

		this.selector.appendChild(fragment);
		setStylesToTheElements.call(_this);
	}
	
	function setStylesToTheElements() {
		const sliderWidth = this.slider.clientWidth;
		this.slider.style.overflow = 'hidden';
		this.inner.style.width = `${sliderWidth * this.numberOfSlides / this.settings.slidesToShow}px`;
		this.slides.forEach(item => {
			item.style.float = 'left';
			item.style.width = `${sliderWidth / this.settings.slidesToShow}px`;
		});
	}
	
	function setNavigation() {
		this.prev = document.createElement('A');
		this.prev.href = '/';
		this.prev.classList.add('smallee-prev');

		this.next = document.createElement('A');
		this.next.href = '/';
		this.next.classList.add('smallee-next');

		this.slider.appendChild(this.prev);
		this.slider.appendChild(this.next);

		initEvents.call(this);
	}

	// This method should makes all calculations
	Smallee.prototype.calculateDimensions() {

	}
	
	// It should be reconsider...
	Smallee.prototype.moveSlides = function(event) {
		const translate = this.inner.style.transform;
		this.pace = 100 / this.numberOfSlides;
		this.wasMovedOn = translate ? Number(translate.slice(translate.indexOf('(') + 1, translate.indexOf('%'))) : 0;
		this.limit = (event.target.className === 'smallee-prev') ? 0 : 100 - ((100 / this.numberOfSlides) * (this.settings.slidesToShow));
		if (event.target.className === 'smallee-prev') {
			this.moveTo = (this.wasMovedOn === Math.round(this.limit * 100) / 100) ? this.limit : this.wasMovedOn + this.pace;
		}else {
			console.log(this.limit);
			this.moveTo = (this.wasMovedOn === -(Math.round(this.limit * 100) / 100)) ? -this.limit : this.wasMovedOn - this.pace;
		}
		this.inner.style.transform = `translate3d(${Math.round(this.moveTo * 100) / 100}%, 0, 0)`;
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
	
	function prevDefAndStopProp(event) {
		event.preventDefault();
		event.stopPropagation();
	}
})();