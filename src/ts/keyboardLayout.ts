import Keyboard from 'simple-keyboard';

export let commonKeyboardOptions = {
	onKeyPress: (button: string) => onKeyPress(button),
	theme: 'simple-keyboard hg-theme-default cvmDark cvmDisabled hg-layout-default',
	syncInstanceInputs: true,
	mergeDisplay: true
};

export let keyboard = new Keyboard('.osk-main', {
	...commonKeyboardOptions,
	layout: {
		default: [
			'{escape} {f1} {f2} {f3} {f4} {f5} {f6} {f7} {f8} {f9} {f10} {f11} {f12}',
			'` 1 2 3 4 5 6 7 8 9 0 - = {backspace}',
			'{tab} q w e r t y u i o p [ ] \\',
			"{capslock} a s d f g h j k l ; ' {enter}",
			'{shiftleft} z x c v b n m , . / {shiftright}',
			'{controlleft} {metaleft} {altleft} {space} {altright} {metaright} {controlright}'
		],
		shift: [
			'{escape} {f1} {f2} {f3} {f4} {f5} {f6} {f7} {f8} {f9} {f10} {f11} {f12}',
			'~ ! @ # $ % ^ & * ( ) _ + {backspace}',
			'{tab} Q W E R T Y U I O P { } |',
			'{capslock} A S D F G H J K L : " {enter}',
			'{shiftleft} Z X C V B N M < > ? {shiftright}',
			'{controlleft} {metaleft} {altleft} {space} {altright} {metaright} {controlright}'
		],
		capslock: [
			'{escape} {f1} {f2} {f3} {f4} {f5} {f6} {f7} {f8} {f9} {f10} {f11} {f12}',
			'` 1 2 3 4 5 6 7 8 9 0 - = {backspace}',
			'{tab} Q W E R T Y U I O P [ ] \\',
			"{capslock} A S D F G H J K L ; ' {enter}",
			'{shiftleft} Z X C V B N M , . / {shiftright}',
			'{controlleft} {metaleft} {altleft} {space} {altright} {metaright} {controlright}'
		],
		shiftcaps: [
			'{escape} {f1} {f2} {f3} {f4} {f5} {f6} {f7} {f8} {f9} {f10} {f11} {f12}',
			'~ ! @ # $ % ^ & * ( ) _ + {backspace}',
			'{tab} q w e r t y u i o p { } |',
			'{capslock} a s d f g h j k l : " {enter}',
			'{shiftleft} z x c v b n m < > ? {shiftright}',
			'{controlleft} {metaleft} {altleft} {space} {altright} {metaright} {controlright}'
		]
	},
	display: {
		'{escape}': 'Esc',
		'{tab}': 'Tab',
		'{backspace}': 'Back',
		'{enter}': 'Enter',
		'{capslock}': 'Caps',
		'{shiftleft}': 'Shift',
		'{shiftright}': 'Shift',
		'{controlleft}': 'Ctrl',
		'{controlright}': 'Ctrl',
		'{altleft}': 'Alt',
		'{altright}': 'Alt',
		'{metaleft}': 'Super',
		'{metaright}': 'Menu'
	}
});

export let keyboardControlPad = new Keyboard('.osk-control', {
	...commonKeyboardOptions,
	layout: {
		default: ['{prtscr} {scrolllock} {pause}', '{insert} {home} {pageup}', '{delete} {end} {pagedown}']
	},
	display: {
		'{prtscr}': 'Print',
		'{scrolllock}': 'Scroll',
		'{pause}': 'Pause',
		'{insert}': 'Ins',
		'{home}': 'Home',
		'{pageup}': 'PgUp',
		'{delete}': 'Del',
		'{end}': 'End',
		'{pagedown}': 'PgDn'
	}
});

export let keyboardArrows = new Keyboard('.osk-arrows', {
	...commonKeyboardOptions,
	layout: {
		default: ['{arrowup}', '{arrowleft} {arrowdown} {arrowright}']
	}
});

export let keyboardNumPad = new Keyboard('.osk-numpad', {
	...commonKeyboardOptions,
	layout: {
		default: ['{numlock} {numpaddivide} {numpadmultiply}', '{numpad7} {numpad8} {numpad9}', '{numpad4} {numpad5} {numpad6}', '{numpad1} {numpad2} {numpad3}', '{numpad0} {numpaddecimal}']
	}
});

export let keyboardNumPadEnd = new Keyboard('.osk-numpadEnd', {
	...commonKeyboardOptions,
	layout: {
		default: ['{numpadsubtract}', '{numpadadd}', '{numpadenter}']
	}
});
