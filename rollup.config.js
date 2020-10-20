//@ts-check

import { build } from 'rollup-simple-configer'
import pkg from './package.json'

const input = './src/index.ts'

export default [].concat(
  build(
    input,
    {
      file: pkg.main,
      format: 'cjs',
    },
    { external: ['custom-defaults'] }
  ),
  build(
    input,
    {
      file: pkg.module,
      format: 'esm',
    },
    { external: ['custom-defaults'] }
  ),
  build(
    input,
    {
      file: 'dist/umd/langer.umd.js',
      format: 'umd',
      name: 'langer',
    },
    { withMin: true }
  )
)
