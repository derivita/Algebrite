import { check_tensor_dimensions } from '../sources/tensor';
import { defs, Tensor } from './defs';
export function alloc_tensor(nelem: number) {
  const p = new Tensor();
  for (let i = 0; i < nelem; i++) {
    p.tensor.elem[i] = defs.zero;
  }

  check_tensor_dimensions(p);
  return p;
}
