const P =
  21888242871839275222246405745257275088696311157297823662689037894645226208583n;
const BETA = -1n;

const P_MINUS_1_DIV_6 =
  3648040478639879203707734290876212514782718526216303943781506315774204368097n;

// BE naf representation of 6x + 2
const ATE_LOOP_COUNT = [
  1, 1, 0, 1, 0, 0, -1, 0, 1, 1, 0, 0, 0, -1, 0, 0, 1, 1, 0, 0, -1, 0, 0, 0, 0,
  0, 1, 0, 0, -1, 0, 0, 1, 1, 1, 0, 0, 0, 0, -1, 0, 1, 0, 0, -1, 0, 1, 1, 0, 0,
  1, 0, 0, -1, 1, 0, 0, -1, 0, 1, 0, 1, 0, 0, 0,
];

const atc = [
  1, 1, 0, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 0, 0, 1, 0, 1, 1, 1, 0, 0, 0, 0, 0,
  0, 1, 1, 1, 0, 0, 1, 1, 0, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 0, 1, 1, 0, 0, 0, 1,
  1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 0, 0,
];

function ateCntSlice(from: number, to: number) {
  let line_cnt = 0;

  for (let i = from; i < to; i++) {
    if (ATE_LOOP_COUNT[i] == 0) {
      line_cnt += 1
    } else {
      line_cnt += 2
    }
  }
}

export { P, P_MINUS_1_DIV_6, BETA, ATE_LOOP_COUNT, atc, ateCntSlice };
