import React from 'react';
import ReactDOM from 'react-dom';
import chai, {expect} from 'chai';
import chaiEnzyme from 'chai-enzyme';
import { mount, shallow } from 'enzyme';
import sinon from 'sinon';
import moment from 'moment';
import {keyCodes} from '../src/utils';
import InfiniteCalendarLunar from '../src/';
import Day from '../src/Day';

const style = {
	day: require('../src/Day/Day.scss'),
	header: require('../src/Header/Header.scss')
};

chai.use(chaiEnzyme());

describe("<InfiniteCalendarLunar/> Selected Date", function() {
	it('should default to `today` if no selected date is provided', () => {
		const wrapper = mount(<InfiniteCalendarLunar/>);
		let selected = wrapper.find(`.${style.day.selected}`);

		expect(selected).to.have.length(1);
		expect(selected).to.have.data('date').equal(moment().format('YYYYMMDD'));
	})
	it('should allow for no initial selected date', () => {
		const wrapper = mount(<InfiniteCalendarLunar selectedDate={false} />);

		expect(wrapper.find(`.${style.day.selected}`)).to.have.length(0);
	})
	it('should scroll to `today` when there is no initial selected date', () => {
		const wrapper = mount(<InfiniteCalendarLunar selectedDate={false} />);
        const inst = wrapper.instance();
        const list = inst.refs.List;
		const expectedOffset = list.getDateOffset(moment());
		const currentOffset = inst.getCurrentOffset();

		expect(currentOffset).to.equal(expectedOffset);
		expect(wrapper.find(`.${style.day.today}`)).to.have.length(1);
	})
	it('should default to maxDate if the selectedDate is after maxDate', () => {
		const max = moment();
		const wrapper = mount(<InfiniteCalendarLunar selectedDate={moment().add(1, 'day')} maxDate={max} />);

		expect(wrapper.state().selectedDate.format('x')).to.equal(max.format('x'));
	})
	it('should default to minDate if the selectedDate is before minDate', () => {
		const min = moment();
		const wrapper = mount(<InfiniteCalendarLunar selectedDate={moment().subtract(1, 'day')} minDate={min} />);

		expect(wrapper.state().selectedDate.format('x')).to.equal(min.format('x'));
	})
	it('should not allow selectedDate to be disabled', () => {
		const wrapper = mount(<InfiniteCalendarLunar selectedDate={moment()} disabledDates={[moment()]} />);

		expect(wrapper.find(`.{style.day.selected}`)).to.have.length(0);
	})
});

describe("<InfiniteCalendarLunar/> Lifecycle Methods", function() {
	it('calls componentDidMount', () => {
		const spy = sinon.spy(InfiniteCalendarLunar.prototype, 'componentDidMount');
		mount(<InfiniteCalendarLunar />);
		expect(spy.calledOnce).to.equal(true);
	})
	it('calls componentWillReceiveProps when props change', () => {
		const spy = sinon.spy(InfiniteCalendarLunar.prototype, 'componentWillReceiveProps');
		const wrapper = mount(<InfiniteCalendarLunar />);
		wrapper.setProps({selectedDate: false});
		expect(spy.calledOnce).to.equal(true);
	})
	it('updates the selectedDate state when props.selectedDate changes', () => {
		const initial = moment();
		const updated = moment('2016-01-01', 'YYYY-MM-DD');
		const wrapper = mount(<InfiniteCalendarLunar selectedDate={initial}/>);
		wrapper.setProps({selectedDate: updated});
		expect(wrapper.props().selectedDate).to.equal(updated);
		expect(wrapper.state().selectedDate.format('x')).to.equal(updated.format('x'));
	})
	it('updates when props.minDate changes', (done) => {
		this.timeout(500);
		const minDate = moment().add(10, 'day');
		const wrapper = mount(<InfiniteCalendarLunar />);

		setTimeout(() => {
			const spy = sinon.spy(InfiniteCalendarLunar.prototype, 'updateYears');
			wrapper.setProps({minDate});
			expect(spy.calledOnce).to.equal(true);
			done();
		}, 500)
	})
	it('updates locale when props.locale changes', (done) => {
		this.timeout(500);
		const selectedDate = moment();
		const wrapper = mount(<InfiniteCalendarLunar selectedDate={new Date()} />);
		let locale = {
			name: 'fr',
			headerFormat: 'dddd, Do MMM',
			months: ["Janvier","Fevrier","Mars","Avril","Mai","Juin","Juillet","Aout","Septembre","Octobre","Novembre","Decembre"],
			monthsShort: ["Janv","Fevr","Mars","Avr","Mai","Juin","Juil","Aout","Sept","Oct","Nov","Dec"],
			weekdays: ["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"],
			weekdaysShort: ["Dim","Lun","Mar","Mer","Jeu","Ven","Sam"],
			blank: 'Aucune date selectionnee',
			todayLabel: {
				long: 'Aujourd\'hui',
				short: 'Auj.'
			}
		};

		setTimeout(() => {
			const spy = sinon.spy(InfiniteCalendarLunar.prototype, 'updateLocale');
			wrapper.setProps({locale});
			expect(spy.calledOnce).to.equal(true);
			// console.log(`.${style.day.today} .${style.day.selection} .${style.day.month}`);
			// console.log(wrapper.find(`.${style.day.today} .${style.day.selection} .${style.day.lunar}`).length);
			expect(wrapper.find(`.${style.header.day} .${style.header.date}`).text()).to.equal(selectedDate.format(locale.headerFormat));
			expect(wrapper.find(`.${style.day.today} .${style.day.selection} .${style.day.lunar}`).text()).to.equal(locale.todayLabel.short);
			done();
		}, 500)
	})

});

describe("<InfiniteCalendarLunar/> Methods", function() {
	it('should scroll to a given date when scrollToDate is called', () => {
		// Bootstrapping
        const div = document.createElement('div');
        document.body.appendChild(div);
        const inst = ReactDOM.render(<InfiniteCalendarLunar/>, div);

		inst.scrollToDate(); // Should default to moment();

		const expectedOffset = inst.getDateOffset(moment());
		const actualOffset = inst.getCurrentOffset();
		expect(expectedOffset).to.equal(actualOffset);
		ReactDOM.unmountComponentAtNode(div);
	})
});

describe("<InfiniteCalendarLunar/> Callback Events", function() {
	this.timeout(3000);

	it('should fire a callback onKeyDown', (done) => {
		const onKeyDown = sinon.spy();
		const wrapper = mount(<InfiniteCalendarLunar onKeyDown={onKeyDown} keyboardSupport={true} />);
		wrapper.simulate('keydown', {keyCode: keyCodes.right});

		expect(onKeyDown.calledOnce).to.equal(true);
		setTimeout(done);
	})
	it('should fire a callback onScroll', (done) => {
		const onScroll = sinon.spy();

		// No need to simulate a scroll event, <InfiniteCalendarLunar/> already scrolls to the selected date on componentDidMount
		mount(<InfiniteCalendarLunar onScroll={onScroll} />);
		expect(onScroll.calledOnce).to.equal(true);
		setTimeout(done);
	})
	it('should fire a callback beforeSelect', (done) => {
		const beforeSelect = sinon.spy();
		const wrapper = mount(<InfiniteCalendarLunar beforeSelect={beforeSelect} />);
		wrapper.find(Day).first().simulate('click');

		expect(beforeSelect.calledOnce).to.equal(true);
		setTimeout(done);
	})
	it('should fire a callback onSelect', (done) => {
		const onSelect = sinon.spy();
		const wrapper = mount(<InfiniteCalendarLunar onSelect={onSelect} />);
		wrapper.find(Day).first().simulate('click');

		expect(onSelect.calledOnce).to.equal(true);
		setTimeout(done);
	})
	it('should fire a callback afterSelect', (done) => {
		const afterSelect = sinon.spy();
		const wrapper = mount(<InfiniteCalendarLunar afterSelect={afterSelect} />);
		wrapper.find(Day).first().simulate('click');

		expect(afterSelect.calledOnce).to.equal(true);
		setTimeout(done);
	})
	it('should allow for select event to be cancelled', (done) => {
		const expected = moment();
		const beforeSelect = function() {
			return false;
		};
		const onSelect = sinon.spy();
		const afterSelect = sinon.spy();
		const wrapper = mount(<InfiniteCalendarLunar selectedDate={expected} beforeSelect={beforeSelect} onSelect={onSelect} afterSelect={afterSelect} />);

		wrapper.find(Day).first().simulate('click');

		expect(onSelect.called).to.equal(false);
		expect(afterSelect.called).to.equal(false);
		expect(wrapper.state().selectedDate.format('YYYYMMDD')).to.equal(expected.format('YYYYMMDD'));
		setTimeout(done);
	})
});

describe("<InfiniteCalendarLunar/> Keyboard Support", function() {
	this.timeout(5000);

	it('should add one day when pressing the right arrow', (done) => {
		const original = moment();
		const expected = moment().add(1, 'day');
		const wrapper = mount(<InfiniteCalendarLunar selectedDate={original} keyboardSupport={true} />);

		wrapper.simulate('keydown', {keyCode: keyCodes.right});
		expect(wrapper.state().highlightedDate.format('YYYYMMDD')).to.equal(expected.format('YYYYMMDD'));
		setTimeout(done);
	})
	it('should subtract one day when pressing the left arrow', (done) => {
		const original = moment();
		const expected = moment().subtract(1, 'day');
		const wrapper = mount(<InfiniteCalendarLunar selectedDate={original} keyboardSupport={true} />);

		wrapper.simulate('keydown', {keyCode: keyCodes.left});
		expect(wrapper.state().highlightedDate.format('YYYYMMDD')).to.equal(expected.format('YYYYMMDD'));
		setTimeout(done);
	})
	it('should add seven days when pressing the down arrow', (done) => {
		const original = moment();
		const expected = moment().add(7, 'day');
		const wrapper = mount(<InfiniteCalendarLunar selectedDate={original} keyboardSupport={true} />);

		wrapper.simulate('keydown', {keyCode: keyCodes.down});
		expect(wrapper.state().highlightedDate.format('YYYYMMDD')).to.equal(expected.format('YYYYMMDD'));
		setTimeout(done);
	})
	it('should subtract seven days when pressing the up arrow', (done) => {
		const original = moment();
		const expected = moment().subtract(7, 'day');
		const wrapper = mount(<InfiniteCalendarLunar selectedDate={original} keyboardSupport={true} />);

		wrapper.simulate('keydown', {keyCode: keyCodes.up});
		expect(wrapper.state().highlightedDate.format('YYYYMMDD')).to.equal(expected.format('YYYYMMDD'));
		setTimeout(done);
	})
	it('should not subtract past minDate', (done) => {
		const minDate = moment().add(1, 'day');
		const wrapper = mount(<InfiniteCalendarLunar minDate={minDate} keyboardSupport={true} />);

		wrapper.simulate('keydown', {keyCode: keyCodes.left});
		wrapper.simulate('keydown', {keyCode: keyCodes.up});
		expect(wrapper.state().highlightedDate.format('YYYYMMDD')).to.equal(minDate.format('YYYYMMDD'));
		setTimeout(done);
	})
	it('should not add past minDate', (done) => {
		const maxDate = moment().add(1, 'day');
		const wrapper = mount(<InfiniteCalendarLunar maxDate={maxDate} keyboardSupport={true} />);

		wrapper.simulate('keydown', {keyCode: keyCodes.right});
		wrapper.simulate('keydown', {keyCode: keyCodes.down});
		expect(wrapper.state().highlightedDate.format('YYYYMMDD')).to.equal(maxDate.format('YYYYMMDD'));
		setTimeout(done);
	})
	it('should select the highlighted date when pressing enter', (done) => {
		const expected = moment().add(7, 'day');
		const wrapper = mount(<InfiniteCalendarLunar keyboardSupport={true} />);

		wrapper.simulate('keydown', {keyCode: keyCodes.down});
		wrapper.simulate('keydown', {keyCode: keyCodes.enter});
		expect(wrapper.state().selectedDate.format('YYYYMMDD')).to.equal(expected.format('YYYYMMDD'));
		setTimeout(done);
	})
	it('should fire an onSelect callback when pressing enter', (done) => {
		const onSelect = sinon.spy();
		const wrapper = mount(<InfiniteCalendarLunar onSelect={onSelect} keyboardSupport={true} />);

		wrapper.simulate('keydown', {keyCode: keyCodes.down});
		wrapper.simulate('keydown', {keyCode: keyCodes.enter});
		expect(onSelect.calledOnce).to.equal(true);
		setTimeout(done);
	})
});
