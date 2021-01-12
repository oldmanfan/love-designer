
const DRAW_IMAGE_EXTEND_EX = 3;
type Image = any;
type Context2D = any;

class Point2D {
  x: number;
  y: number;
  u: number;
  v: number;

  constructor(_x: number, _y: number, _u: number, _v: number) {
    this.x = _x;
    this.y = _y;
    this.u = _u;
    this.v = _v;
  }

  clone(): Point2D {
    return new Point2D(this.x, this.y, this.u, this.v);
  }

  changeByMatrix4(te: any): void {
    // TODO(liangiqn.fanlq): 没有实现的方法
  }
}

class Vert2D {
  private p0: number;
  private p1: number;
  private p2: number;

  constructor(_p0: number, _p1: number, _p2: number) {
    this.p0 = _p0;
    this.p1 = _p1;
    this.p2 = _p2;
  }

  clone(): Vert2D {
    return new Vert2D(this.p0, this.p1, this.p2);
  }

  drawMeshLineToContext(plist: Point2D[], ctx: Context2D): void {
    let p0 = plist[this.p0],
        p1 = plist[this.p1],
        p2 = plist[this.p2];

    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p0.x, p0.y);
  }

  drawImageToContext(plist: Point2D[], img: Image, ctx: Context2D): void {
    let p0 = plist[this.p0],
        p1 = plist[this.p1],
        p2 = plist[this.p2];
    Vert2D.drawImageToContextWithPoints(img, ctx,
      p0.x, p0.y,
      p1.x, p1.y,
      p2.x, p2.y,
      p0.u, p0.v,
      p1.u, p1.v,
      p2.u, p2.v);
  }

  static extendVert(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number): number[] {
    var x = 2 * x0 - x1 - x2,
        y = 2 * y0 - y1 - y2;
    var d = Math.sqrt(DRAW_IMAGE_EXTEND_EX / (x * x + y * y));
    return [x0 + x * d, y0 + y * d];
  }

  static drawImageToContextWithPoints(img: Image, ctx: Context2D,
      x0: number, y0: number,
      x1: number, y1: number,
      x2: number, y2: number,
      u0: number, v0: number,
      u1: number, v1: number,
      u2: number, v2: number) {
    u0 *= img.width;
    u1 *= img.width;
    u2 *= img.width;
    v0 *= img.height;
    v1 *= img.height;
    v2 *= img.height;

    //fix gap in images
    var s0 = Vert2D.extendVert(x0, y0, x1, y1, x2, y2);
    var s1 = Vert2D.extendVert(x1, y1, x0, y0, x2, y2);
    var s2 = Vert2D.extendVert(x2, y2, x1, y1, x0, y0);
    //fix end

    ctx.beginPath();
    ctx.moveTo(s0[0], s0[1]);
    ctx.lineTo(s1[0], s1[1]);
    ctx.lineTo(s2[0], s2[1]);
    ctx.closePath();

    x1 -= x0;
    y1 -= y0;
    x2 -= x0;
    y2 -= y0;

    u1 -= u0;
    v1 -= v0;
    u2 -= u0;
    v2 -= v0;

    var det = 1 / (u1 * v2 - u2 * v1),
        a = (v2 * x1 - v1 * x2) * det,
        b = (v2 * y1 - v1 * y2) * det,
        c = (u1 * x2 - u2 * x1) * det,
        d = (u1 * y2 - u2 * y1) * det,
        e = x0 - a * u0 - c * v0,
        f = y0 - b * u0 - d * v0;

    ctx.save();
    ctx.transform(a, b, c, d, e, f);
    ctx.clip();
    ctx.drawImage(img, 0, 0);
    ctx.restore();
  }
}

export class Mesh2D {
  points: Point2D[];
  verts:  Vert2D[];

  constructor() {
      this.points = [];
      this.verts = [];
  }

  clone(): Mesh2D {
      var n = new Mesh2D();
      for (var i = 0; i < this.points.length; i++) {
          n.points[i] = this.points[i].clone();
      }
      for (var i = 0; i < this.verts.length; i++) {
          n.verts[i] = this.verts[i]; //not clone
      }
      return n;
  }

  move(x: number, y: number): void {
      for (var i = 0; i < this.points.length; i++) {
          this.points[i].x += x;
          this.points[i].y += y;
      }
  }

  changeByMatrix4(te: any) {
      for (var i = 0; i < this.points.length; i++) {
          this.points[i].changeByMatrix4(te);
      }
  }

  drawMeshHelper(ctx: Context2D, dots: Point2D[]) {
      ctx.save();
      ctx.beginPath();
      ctx.lineWidth = 0.5;
      ctx.strokeStyle = "#0000ff";
      ctx.setLineDash([15, 5]);
      ctx.moveTo(dots[0].x, dots[0].y);
      ctx.lineTo(dots[1].x, dots[1].y);
      ctx.lineTo(dots[2].x, dots[2].y);
      ctx.lineTo(dots[3].x, dots[3].y);
      ctx.lineTo(dots[0].x, dots[0].y);
      ctx.stroke();
      ctx.restore();
  }

  drawMeshLine(ctx: Context2D) {
      ctx.save();
      ctx.lineWidth = 0.5;
      ctx.strokeStyle = "#0000ff";
      for (var i = 0; i < this.verts.length; i++) {
          this.verts[i].drawMeshLineToContext(this.points, ctx);
      }
      ctx.stroke();
      ctx.restore();
  }

  drawImageToContext(img: Image, ctx: Context2D) {
      // console.log("this.verts", this.verts)
      for (var i = 0; i < this.verts.length; i++) {
          this.verts[i].drawImageToContext(this.points, img, ctx);
      }
  }

  static createMapMesh(width: number, height: number, divW: number, divH: number) {
      var m = new Mesh2D();
      var widthSingle = width / divW,
          heightSingle = height / divH;
      var uSingle = 1 / divW,
          vSingel = 1 / divH;
      for (var i = 0; i <= divH; i++) {
          for (var j = 0; j <= divW; j++) {
              m.points.push(new Point2D(j * widthSingle, i * heightSingle, j * uSingle, i * vSingel));
          }
      }
      for (var i = 0; i < divH; i++) {
          for (var j = 0; j < divW; j++) {
              var startPoint = (divW + 1) * i + j;
              m.verts.push(new Vert2D(startPoint + 1, startPoint, startPoint + divW + 1));
              m.verts.push(new Vert2D(startPoint + divW + 1, startPoint + divW + 2, startPoint + 1));
          }
      }
      return m;
  }
}