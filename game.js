// title:   GMTK 2024
// authors: Blessed BlessedEgg, Comet1772, lemgob, Wren
// desc:    
// site:    
// license: MIT License
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

// <WAVES>
// 000:00000000ffffffff00000000ffffffff
// 001:0123456789abcdeffedcba9876543210
// 002:0123456789abcdef0123456789abcdef
// </WAVES>

// <SFX>
// 000:000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000304000000000
// </SFX>

// <TRACKS>
// 000:100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
// </TRACKS>

// <PALETTE>
// 000:1a1c2c5d275db13e53ef7d57ffcd75a7f07038b76425717929366f3b5dc941a6f673eff7f4f4f494b0c2566c86333c57
// </PALETTE>

