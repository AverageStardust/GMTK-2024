// title:   GMTK 2024
// authors: Blessed BlessedEgg, Comet1772, lemgob, Wren
// desc:    
// site:    https://github.com/AverageStardust/GMTK-2024
// license: 
// version: 0.1
// script:  js

let player;
let frame = 0;

function BOOT() {
	player = new Player();
	player.setPosition(new Vector2(15, 15));
}

function TIC() {
	// UPDATE
	player.update();

	// DRAW
	map(0, 0, 30, 17, 0, 0);
	player.draw();

	frame++;
}

class Player {
	constructor() {
		this.setPosition(Vector2.zero());
		this.lastMovedFrame = -Infinity;
		this.moveDelay = 16;
	}

	setPosition(position) {
		this.position = position;
		this.displayPosition = this.position.mul(8);
	}

	update() {
		const targetDisplayPosition = this.position.mul(8);
		this.displayPosition = this.displayPosition.moveTo(targetDisplayPosition, 1);
		this.control();
	}

	control() {
		if (this.lastMovedFrame + this.moveDelay <= frame) {
			if (btn(0) && btn(2)) this.moveUpLeft();
			else if (btn(1) && btn(3)) this.moveDownRight();
			else if (btn(2) && btn(1)) this.moveLeftDown();
			else if (btn(3) && btn(0)) this.moveRightUp();
			else if (btn(0)) this.moveUp();
			else if (btn(1)) this.moveDown();
			else if (btn(2)) this.moveLeft();
			else if (btn(3)) this.moveRight();
		}
	}

	moveUpLeft() {
		if (this.getNeighbourFlag(0, -1, 0)) {
			this.moveLeft();
			this.moveUp();
		} else {
			this.moveUp();
			this.moveLeft();
		}
	}

	moveDownRight() {
		if (this.getNeighbourFlag(0, 1, 0)) {
			this.moveRight();
			this.moveDown();
		} else {
			this.moveDown();
			this.moveRight();
		}
	}

	moveLeftDown() {
		if (this.getNeighbourFlag(-1, 0, 0)) {
			this.moveDown();
			this.moveLeft();
		} else {
			this.moveLeft();
			this.moveDown();
		}
	}

	moveRightUp() {
		if (this.getNeighbourFlag(1, 0, 0)) {
			this.moveUp();
			this.moveRight();
		} else {
			this.moveRight();
			this.moveUp();
		}
	}

	moveUp() {
		if (this.getNeighbourFlag(0, -1, 0)) return;
		this.position.y--;
		this.lastMovedFrame = frame;
	}

	moveDown() {
		if (this.getNeighbourFlag(0, 1, 0)) return;
		this.position.y++;
		this.lastMovedFrame = frame;
	}

	moveLeft() {
		if (this.getNeighbourFlag(-1, 0, 0)) return;
		this.position.x--;
		this.lastMovedFrame = frame;
	}

	moveRight() {
		if (this.getNeighbourFlag(1, 0, 0)) return;
		this.position.x++;
		this.lastMovedFrame = frame;
	}

	getNeighbourFlag(offsetX, offsetY, flag) {
		let { x, y } = this.position.add(new Vector2(offsetX, offsetY));
		return fget(mget(x, y), flag);
	}

	draw() {
		let { x, y } = this.displayPosition;
		rect(x, y, 8, 8, 12);
	}
}

class Vector2 {
	static zero() {
		return new Vector2(0, 0);
	}

	constructor(x = 0, y = 0) {
		this.x = x;
		this.y = y;
	}

	add(vector) {
		return new Vector2(this.x + vector.x, this.y + vector.y);
	}

	sub(vector) {
		return new Vector2(this.x - vector.x, this.y - vector.y);
	}

	mul(scaler) {
		return new Vector2(this.x * scaler, this.y * scaler);
	}

	moveTo(vector, step) {
		return new Vector2(
			moveTo(this.x, vector.x, step),
			moveTo(this.y, vector.y, step));
	}
}

function moveTo(start, end, step) {
	let differance = end - start;
	differance = Math.sign(differance) * step;
	return start + differance;
}

// <TILES>
// 253:6666666666666666666666666666666666666666666666666666666666666666
// 254:dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd
// 255:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
// </TILES>

// <MAP>
// 000:dfdfdfdfdfdfdfdfdfdfdfffffffdfdfdfdfdfdfdfdfdfdfdfdfdfdfdfdf000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
// 001:dfdfdfdfdfdfdfdfdfdfdfdfffffffffdfdfdfdfdfdfdfdfdfdfdfdfdfdf000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
// 002:dfdfdfdfdfdfdfdfdfdfdfdfdfffffffffffffdfdfdfdfdfdfdfdfdfdfdf000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
// 003:dfdfdfdfdfdfdfdfdfdfdfdfdfdfdfffffffffffefefffffdfdfdfdfdfdf000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
// 004:dfdfdfdfdfdfdfdfdfdfdfdfdfdfdfdfdfdfffffefefffffffffffffffff000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
// 005:ffffdfdfdfdfdfdfdfdfdfdfdfdfdfdfdfdfdfdfdfdfdfffffffffdfdfdf000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
// 006:dfffffdfdfdfdfdfdfdfdfdfdfdfdfdfdfdfdfdfdfdfdfdfdfdfdfdfdfdf000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
// 007:dfdfffffffffdfdfdfdfdfdfdfdfdfdfdfdfdfdfdfdfdfdfdfdfdfdfdfdf000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
// 008:dfdfdfdfdfffefffffdfdfdfdfdfdfdfdfdfdfdfdfdfdfdfdfdfdfdfdfdf000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
// 009:dfdfdfdfdfdfdfdfffffffffdfdfdfdfdfdfdfdfdfdfdfdfffffffefefff000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
// 010:dfdfdfdfdfdfdfdfdfdfdfffffffffffdfdfdfdfdfdfffffffffefefefff000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
// 011:dfdfdfdfdfdfdfdfdfdfffffffffffffffffffffffffffffffffefefefff000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
// 012:dfdfdfdfdfffffffefffffffffffffffffffffffffffffffdfdfdfdfdfdf000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
// 013:ffefffffffffffffefffffdfdfdfdfdfdfdfdfdfdfdfdfdfdfdfdfdfdfdf000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
// 014:dfdfdfdfdfdfdfdfdfdfdfdfdfdfdfdfdfdfdfdfdfdfdfdfdfdfdfdfdfdf000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
// 015:dfdfdfdfdfdfdfdfdfdfdfdfdfdfdfdfdfdfdfdfdfdfdfdfdfdfdfdfdfdf000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
// 016:dfdfdfdfdfdfdfdfdfdfdfdfdfdfdfdfdfdfdfdfdfdfdfdfdfdfdfdfdfdf000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
// </MAP>

// <WAVES>
// 000:00000000ffffffff00000000ffffffff
// 001:12356789abcdeeeeeedcba9876543100
// 002:0123456789abcdef0123456789abcdef
// </WAVES>

// <SFX>
// 000:0f000f000f000f000f000f000f000f000f000f000f000f000f000f000f000f000f000f000f000f000f000f000f000f000f000f000f000f000f000f00302400000000
// 062:9f087f095f094f0b3f0c2f0d2f0e1f0e0f0e0f0f0f0f0f000f000f000f000f000f011f012f022f032f033f053f053f063f042f031f020f020f010f01355000ff00ff
// 063:d10081004100010001000100010001000100010001000100010011001100210021003100410051005100610061007100710081008100810091009100505000000000
// </SFX>

// <PATTERNS>
// 000:006cf10139f11008f1f008ffb008fd1008f1f008fda008ff1008f1f008ffb008ff102cf1021100f47effc008ff9008ffd008ffa008ffe008ff7008ff107cf14209fd6008ff1008f14008fd6008ff1008f14008fd6008ff0000001008f1000000f008ff000000e008ff1008f1f008ff000000e008ff1008f1000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
// 001:40110e002100003100014100024100034100044100054100064100000000000000000000055100000000000000000000000000000000000000000000000000000000000000000000056100000000000000000000055100000000000000000000000000000000000000000000045100000000000000000000000000000000000000000000044100000000000000000000034100000000000000000000033100000000000000000000033100033100033100032100031100030100020100010100
// </PATTERNS>

// <TRACKS>
// 000:100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
// 001:2000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000ef
// </TRACKS>

// <FLAGS>
// 000:00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010
// </FLAGS>

// <PALETTE>
// 000:1a1c2c5d275db13e53ef7d57ffcd75a7f07038b76425717929366f3b5dc941a6f673eff7f4f4f494b0c2566c86333c57
// </PALETTE>

