import { Rect } from '../utils.js';

export class BSPNode {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.left = null;
    this.right = null;
    this.room = null;
  }

  split() {
    if (this.left || this.right) return false;

    const splitH = Math.random() > 0.5;
    const max = (splitH ? this.h : this.w) - 10;

    if (max <= 10) return false;

    const split = Math.floor(Math.random() * (max - 10)) + 10;

    if (splitH) {
      this.left = new BSPNode(this.x, this.y, this.w, split);
      this.right = new BSPNode(this.x, this.y + split, this.w, this.h - split);
    } else {
      this.left = new BSPNode(this.x, this.y, split, this.h);
      this.right = new BSPNode(this.x + split, this.y, this.w - split, this.h);
    }

    return true;
  }

  createRooms() {
    if (this.left || this.right) {
      if (this.left) this.left.createRooms();
      if (this.right) this.right.createRooms();
    } else {
      const roomW = Math.floor(Math.random() * (this.w - 4)) + 4;
      const roomH = Math.floor(Math.random() * (this.h - 4)) + 4;
      const roomX = this.x + Math.floor(Math.random() * (this.w - roomW));
      const roomY = this.y + Math.floor(Math.random() * (this.h - roomH));

      this.room = new Rect(roomX, roomY, roomW, roomH);
    }
  }

  getRoom() {
    if (this.room) return this.room;

    let leftRoom = null;
    let rightRoom = null;

    if (this.left) leftRoom = this.left.getRoom();
    if (this.right) rightRoom = this.right.getRoom();

    if (!leftRoom && !rightRoom) return null;
    if (!rightRoom) return leftRoom;
    if (!leftRoom) return rightRoom;

    return Math.random() > 0.5 ? leftRoom : rightRoom;
  }

  getRooms() {
    if (this.room) return [this.room];

    let rooms = [];
    if (this.left) rooms = rooms.concat(this.left.getRooms());
    if (this.right) rooms = rooms.concat(this.right.getRooms());

    return rooms;
  }
}
