'use client';

import { useState } from 'react';
import type { Editor } from '@tiptap/core';

interface FormulaPaletteProps {
  editor: Editor | null;
  onClose: () => void;
}

interface Template {
  label: string;
  latex: string;
  desc: string;
}

const categories: { name: string; items: Template[] }[] = [
  {
    name: 'Fractions & Roots',
    items: [
      { label: '\u00BD', latex: '\\frac{}{}', desc: 'Fraction' },
      { label: '\u221A', latex: '\\sqrt{}', desc: 'Square Root' },
      { label: '\u221B', latex: '\\sqrt[3]{}', desc: 'Cube Root' },
      { label: '\u221C', latex: '\\sqrt[n]{}', desc: 'nth Root' },
    ],
  },
  {
    name: 'Exponents & Indices',
    items: [
      { label: 'x\u00B2', latex: 'x^{}', desc: 'Superscript' },
      { label: 'x\u2099', latex: 'x_{}', desc: 'Subscript' },
      { label: 'x\u2099\u00B2', latex: 'x_{n}^{}', desc: 'Both' },
      { label: '\u00AF\u00AF', latex: '\\bar{}', desc: 'Overline' },
    ],
  },
  {
    name: 'Calculus',
    items: [
      { label: '\u222B', latex: '\\int_{}^{}', desc: 'Integral' },
      { label: '\u222B\u2093\u1D50', latex: '\\int_{a}^{b}', desc: 'Definite Integral' },
      { label: '\u2211', latex: '\\sum_{}^{}', desc: 'Summation' },
      { label: '\u220F', latex: '\\prod_{}^{}', desc: 'Product' },
      { label: '\u2202', latex: '\\partial', desc: 'Partial Derivative' },
      { label: '\u2207', latex: '\\nabla', desc: 'Gradient' },
      { label: '\u2113', latex: '\\ell', desc: 'Script L' },
    ],
  },
  {
    name: 'Limits',
    items: [
      { label: 'lim', latex: '\\lim_{}', desc: 'Limit' },
      { label: 'lim\u2192', latex: '\\lim_{x \\to }', desc: 'Limit To' },
      { label: '\u2192', latex: '\\to', desc: 'To' },
      { label: '\u221E', latex: '\\infty', desc: 'Infinity' },
    ],
  },
  {
    name: 'Greek Letters',
    items: [
      { label: '\u03B1', latex: '\\alpha', desc: 'Alpha' },
      { label: '\u03B2', latex: '\\beta', desc: 'Beta' },
      { label: '\u03B3', latex: '\\gamma', desc: 'Gamma' },
      { label: '\u03B4', latex: '\\delta', desc: 'Delta' },
      { label: '\u03B5', latex: '\\epsilon', desc: 'Epsilon' },
      { label: '\u03B8', latex: '\\theta', desc: 'Theta' },
      { label: '\u03BB', latex: '\\lambda', desc: 'Lambda' },
      { label: '\u03BC', latex: '\\mu', desc: 'Mu' },
      { label: '\u03C0', latex: '\\pi', desc: 'Pi' },
      { label: '\u03C3', latex: '\\sigma', desc: 'Sigma' },
      { label: '\u03C6', latex: '\\phi', desc: 'Phi' },
      { label: '\u03C9', latex: '\\omega', desc: 'Omega' },
    ],
  },
  {
    name: 'Operators',
    items: [
      { label: '\u00B1', latex: '\\pm', desc: 'Plus-Minus' },
      { label: '\u00D7', latex: '\\times', desc: 'Multiplication' },
      { label: '\u00F7', latex: '\\div', desc: 'Division' },
      { label: '\u22C5', latex: '\\cdot', desc: 'Dot' },
      { label: '\u2218', latex: '\\circ', desc: 'Circle' },
      { label: '\u221D', latex: '\\propto', desc: 'Proportional' },
      { label: '\u2216', latex: '\\setminus', desc: 'Set Minus' },
    ],
  },
  {
    name: 'Relations',
    items: [
      { label: '\u2264', latex: '\\leq', desc: 'Less or Equal' },
      { label: '\u2265', latex: '\\geq', desc: 'Greater or Equal' },
      { label: '\u2260', latex: '\\neq', desc: 'Not Equal' },
      { label: '\u2248', latex: '\\approx', desc: 'Approximately' },
      { label: '\u2261', latex: '\\equiv', desc: 'Equivalent' },
      { label: '\u2208', latex: '\\in', desc: 'Element Of' },
      { label: '\u2282', latex: '\\subset', desc: 'Subset' },
      { label: '\u2283', latex: '\\supset', desc: 'Superset' },
      { label: '\u2286', latex: '\\subseteq', desc: 'Subset Eq' },
      { label: '\u2287', latex: '\\supseteq', desc: 'Superset Eq' },
      { label: '\u2229', latex: '\\cap', desc: 'Intersection' },
      { label: '\u222A', latex: '\\cup', desc: 'Union' },
    ],
  },
  {
    name: 'Arrows',
    items: [
      { label: '\u2192', latex: '\\rightarrow', desc: 'Right Arrow' },
      { label: '\u2190', latex: '\\leftarrow', desc: 'Left Arrow' },
      { label: '\u21D2', latex: '\\Rightarrow', desc: 'Right Implication' },
      { label: '\u21D0', latex: '\\Leftarrow', desc: 'Left Implication' },
      { label: '\u2194', latex: '\\leftrightarrow', desc: 'Left Right' },
      { label: '\u21D4', latex: '\\Leftrightarrow', desc: 'Iff' },
      { label: '\u21A6', latex: '\\mapsto', desc: 'Maps To' },
      { label: '\u2192', latex: '\\xrightarrow{}', desc: 'X Right Arrow' },
    ],
  },
  {
    name: 'Functions',
    items: [
      { label: 'sin', latex: '\\sin{}', desc: 'Sine' },
      { label: 'cos', latex: '\\cos{}', desc: 'Cosine' },
      { label: 'tan', latex: '\\tan{}', desc: 'Tangent' },
      { label: 'log', latex: '\\log{}', desc: 'Logarithm' },
      { label: 'ln', latex: '\\ln{}', desc: 'Natural Log' },
      { label: 'sin\u207B\u00B9', latex: '\\sin^{-1}{}', desc: 'Arc Sine' },
      { label: 'max', latex: '\\max{}', desc: 'Maximum' },
      { label: 'min', latex: '\\min{}', desc: 'Minimum' },
    ],
  },
  {
    name: 'Brackets & Fences',
    items: [
      { label: '( )', latex: '\\left(\\right)', desc: 'Parentheses' },
      { label: '[ ]', latex: '\\left[\\right]', desc: 'Brackets' },
      { label: '{ }', latex: '\\left\\{\\right\\}', desc: 'Curly Braces' },
      { label: '| |', latex: '\\lvert \\rvert', desc: 'Absolute' },
      { label: '\u2308 \u2309', latex: '\\lceil \\rceil', desc: 'Ceiling' },
      { label: '\u230A \u230B', latex: '\\lfloor \\rfloor', desc: 'Floor' },
    ],
  },
  {
    name: 'Matrix & Vectors',
    items: [
      { label: '[ ]', latex: '\\begin{bmatrix} & \\\\ & \\end{bmatrix}', desc: 'Matrix' },
      { label: 'det', latex: '\\det{}', desc: 'Determinant' },
      { label: '\u20D7', latex: '\\vec{}', desc: 'Vector' },
      { label: '\u0302', latex: '\\hat{}', desc: 'Hat' },
      { label: '\u0303', latex: '\\tilde{}', desc: 'Tilde' },
      { label: '\u0307', latex: '\\dot{}', desc: 'Dot' },
    ],
  },
  {
    name: 'Sets & Logic',
    items: [
      { label: '\u2200', latex: '\\forall', desc: 'For All' },
      { label: '\u2203', latex: '\\exists', desc: 'There Exists' },
      { label: '\u2204', latex: '\\nexists', desc: 'Not Exist' },
      { label: '\u2234', latex: '\\therefore', desc: 'Therefore' },
      { label: '\u2235', latex: '\\because', desc: 'Because' },
      { label: '\u2220', latex: '\\angle', desc: 'Angle' },
      { label: '\u22A5', latex: '\\perp', desc: 'Perpendicular' },
      { label: '\u2225', latex: '\\parallel', desc: 'Parallel' },
    ],
  },
  {
    name: 'Spacing',
    items: [
      { label: '  ', latex: '\\,', desc: 'Thin Space' },
      { label: '  ', latex: '\\:', desc: 'Medium Space' },
      { label: '  ', latex: '\\;', desc: 'Thick Space' },
      { label: '  ', latex: '\\quad', desc: 'Quad Space' },
      { label: '  ', latex: '\\qquad', desc: 'Double Quad' },
    ],
  },
  {
    name: 'Algebra Forms',
    items: [
      { label: 'Quadratic', latex: 'x = \\dfrac{-b \\pm \\sqrt{b^{2} - 4ac}}{2a}', desc: 'Quadratic Formula' },
      { label: 'a\u00B2 - b\u00B2', latex: 'a^{2} - b^{2} = (a+b)(a-b)', desc: 'Difference of Squares' },
      { label: '(a\u00B1b)\u00B2', latex: '(a \\pm b)^{2} = a^{2} \\pm 2ab + b^{2}', desc: 'Perfect Square' },
      { label: 'a\u00B3 + b\u00B3', latex: 'a^{3} + b^{3} = (a+b)(a^{2} - ab + b^{2})', desc: 'Sum of Cubes' },
      { label: 'a\u00B3 - b\u00B3', latex: 'a^{3} - b^{3} = (a-b)(a^{2} + ab + b^{2})', desc: 'Difference of Cubes' },
    ],
  },
  {
    name: 'Logarithms',
    items: [
      { label: 'log(xy)', latex: '\\log_{a}(xy) = \\log_{a} x + \\log_{a} y', desc: 'Logarithm Product Rule' },
      { label: 'log(x/y)', latex: '\\log_{a}\\left(\\frac{x}{y}\\right) = \\log_{a} x - \\log_{a} y', desc: 'Logarithm Quotient Rule' },
      { label: 'log(x\u207F)', latex: '\\log_{a}(x^{n}) = n\\log_{a} x', desc: 'Logarithm Power Rule' },
      { label: 'Base Chg', latex: '\\log_{a} x = \\frac{\\log x}{\\log a}', desc: 'Change of Base' },
      { label: 'ln x', latex: '\\ln x = \\log_{e} x', desc: 'Natural Logarithm' },
    ],
  },
  {
    name: 'Series',
    items: [
      { label: 'AP nth', latex: 'T_{n} = a + (n-1)d', desc: 'Arithmetic nth Term' },
      { label: 'AP Sum', latex: 'S_{n} = \\frac{n}{2}\\bigl(2a + (n-1)d\\bigr)', desc: 'Arithmetic Series Sum' },
      { label: 'GP nth', latex: 'T_{n} = ar^{n-1}', desc: 'Geometric nth Term' },
      { label: 'GP Sum', latex: 'S_{n} = \\frac{a(1 - r^{n})}{1 - r}', desc: 'Geometric Series Sum' },
      { label: 'Sum\u2192\u221E', latex: 'S_{\\infty} = \\frac{a}{1 - r}', desc: 'Sum to Infinity' },
      { label: 'nCr', latex: '\\binom{n}{r} = \\frac{n!}{r!(n-r)!}', desc: 'Binomial Coefficient' },
    ],
  },
  {
    name: 'Trig IDs',
    items: [
      { label: 'sin\u00B2+cos\u00B2=1', latex: '\\sin^{2}\\theta + \\cos^{2}\\theta = 1', desc: 'Pythagorean Identity' },
      { label: '1+tan\u00B2', latex: '1 + \\tan^{2}\\theta = \\sec^{2}\\theta', desc: 'Tan-Sec Identity' },
      { label: '1+cot\u00B2', latex: '1 + \\cot^{2}\\theta = \\csc^{2}\\theta', desc: 'Cot-Csc Identity' },
      { label: 'sin(A\u00B1B)', latex: '\\sin(A \\pm B) = \\sin A\\cos B \\pm \\cos A\\sin B', desc: 'Sine Sum/Difference' },
      { label: 'cos(A\u00B1B)', latex: '\\cos(A \\pm B) = \\cos A\\cos B \\mp \\sin A\\sin B', desc: 'Cosine Sum/Difference' },
      { label: 'sin 2A', latex: '\\sin 2A = 2\\sin A\\cos A', desc: 'Double Angle Sine' },
      { label: 'cos 2A', latex: '\\cos 2A = \\cos^{2}A - \\sin^{2}A', desc: 'Double Angle Cosine' },
      { label: 'Sine Rule', latex: '\\frac{a}{\\sin A} = \\frac{b}{\\sin B} = \\frac{c}{\\sin C}', desc: 'Sine Rule' },
      { label: 'Cosine Rule', latex: 'a^{2} = b^{2} + c^{2} - 2bc\\cos A', desc: 'Cosine Rule' },
      { label: '\u00BDab sinC', latex: '\\frac{1}{2}ab\\sin C', desc: 'Triangle Area' },
    ],
  },
  {
    name: 'Coord Geom',
    items: [
      { label: 'Distance', latex: 'd = \\sqrt{(x_{2} - x_{1})^{2} + (y_{2} - y_{1})^{2}}', desc: 'Distance Formula' },
      { label: 'Midpoint', latex: 'M = \\left(\\frac{x_{1}+x_{2}}{2},\\,\\frac{y_{1}+y_{2}}{2}\\right)', desc: 'Midpoint Formula' },
      { label: 'Gradient', latex: 'm = \\frac{y_{2} - y_{1}}{x_{2} - x_{1}}', desc: 'Slope / Gradient' },
      { label: 'Line Eq', latex: 'y - y_{1} = m(x - x_{1})', desc: 'Point-Slope Line Equation' },
      { label: 'Circle', latex: '(x - h)^{2} + (y - k)^{2} = r^{2}', desc: 'Circle Equation (centre-radius)' },
    ],
  },
  {
    name: 'Calculus',
    items: [
      { label: 'd/dx x\u207F', latex: '\\frac{d}{dx}(x^{n}) = nx^{n-1}', desc: 'Power Rule' },
      { label: 'd/dx sin', latex: '\\frac{d}{dx}(\\sin x) = \\cos x', desc: 'Derivative of Sine' },
      { label: 'd/dx cos', latex: '\\frac{d}{dx}(\\cos x) = -\\sin x', desc: 'Derivative of Cosine' },
      { label: 'd/dx e\u02E3', latex: '\\frac{d}{dx}(e^{x}) = e^{x}', desc: 'Derivative of e^x' },
      { label: 'd/dx ln', latex: '\\frac{d}{dx}(\\ln x) = \\frac{1}{x}', desc: 'Derivative of ln x' },
      { label: 'Product', latex: "(uv)' = u'v + uv'", desc: 'Product Rule' },
      { label: 'Quotient', latex: "\\left(\\frac{u}{v}\\right)' = \\frac{u'v - uv'}{v^{2}}", desc: 'Quotient Rule' },
      { label: 'Chain', latex: '\\frac{dy}{dx} = \\frac{dy}{du} \\cdot \\frac{du}{dx}', desc: 'Chain Rule' },
      { label: '\u222B x\u207F', latex: '\\int x^{n}\\,dx = \\frac{x^{n+1}}{n+1} + C', desc: 'Integration Power Rule' },
      { label: '\u222B e\u02E3', latex: '\\int e^{x}\\,dx = e^{x} + C', desc: 'Integral of e^x' },
      { label: '\u222B 1/x', latex: '\\int \\frac{1}{x}\\,dx = \\ln|x| + C', desc: 'Integral of 1/x' },
    ],
  },
  {
    name: 'Mensuration',
    items: [
      { label: 'Circle Area', latex: 'A = \\pi r^{2}', desc: 'Area of Circle' },
      { label: 'Circle Circ', latex: 'C = 2\\pi r', desc: 'Circumference of Circle' },
      { label: 'Cylinder Vol', latex: 'V = \\pi r^{2} h', desc: 'Volume of Cylinder' },
      { label: 'Cone Vol', latex: 'V = \\frac{1}{3}\\pi r^{2} h', desc: 'Volume of Cone' },
      { label: 'Sphere Vol', latex: 'V = \\frac{4}{3}\\pi r^{3}', desc: 'Volume of Sphere' },
      { label: 'Sector Area', latex: 'A = \\frac{1}{2}r^{2}\\theta', desc: 'Area of Sector' },
      { label: 'Trapezium', latex: 'A = \\frac{1}{2}(a+b)h', desc: 'Area of Trapezium' },
    ],
  },
  {
    name: 'Phys: Mechanics',
    items: [
      { label: 'v = d/t', latex: 'v = \\frac{d}{t}', desc: 'Speed' },
      { label: 'a = \u0394v/t', latex: 'a = \\frac{v - u}{t}', desc: 'Acceleration' },
      { label: 'v = u+at', latex: 'v = u + at', desc: 'SUVAT 1' },
      { label: 's = ut+\u00BDat\u00B2', latex: 's = ut + \\frac{1}{2}at^{2}', desc: 'SUVAT 2' },
      { label: 'v\u00B2 = u\u00B2+2as', latex: 'v^{2} = u^{2} + 2as', desc: 'SUVAT 3' },
      { label: 'F = ma', latex: 'F = ma', desc: 'Newton\'s Second Law' },
      { label: 'W = mg', latex: 'W = mg', desc: 'Weight' },
      { label: 'p = mv', latex: 'p = mv', desc: 'Momentum' },
      { label: 'KE = \u00BDmv\u00B2', latex: 'KE = \\frac{1}{2}mv^{2}', desc: 'Kinetic Energy' },
      { label: 'GPE = mgh', latex: 'GPE = mgh', desc: 'Gravitational Potential Energy' },
      { label: 'W = Fd', latex: 'W = Fd\\cos\\theta', desc: 'Work Done' },
      { label: 'P = W/t', latex: 'P = \\frac{W}{t}', desc: 'Power' },
      { label: 'v = f\u03BB', latex: 'v = f\\lambda', desc: 'Wave Equation' },
      { label: 'T = 1/f', latex: 'T = \\frac{1}{f}', desc: 'Period' },
    ],
  },
  {
    name: 'Phys: Electricity',
    items: [
      { label: 'V = IR', latex: 'V = IR', desc: 'Ohm\'s Law' },
      { label: 'P = IV', latex: 'P = IV', desc: 'Electrical Power' },
      { label: 'E = VIt', latex: 'E = VIt', desc: 'Electrical Energy' },
      { label: 'Q = It', latex: 'Q = It', desc: 'Charge' },
      { label: 'R Series', latex: 'R_{T} = R_{1} + R_{2} + \\dots', desc: 'Series Resistors' },
      { label: 'R Parallel', latex: '\\frac{1}{R_{T}} = \\frac{1}{R_{1}} + \\frac{1}{R_{2}} + \\dots', desc: 'Parallel Resistors' },
      { label: 'Coulomb', latex: 'F = \\frac{kq_{1}q_{2}}{r^{2}}', desc: 'Coulomb\'s Law' },
    ],
  },
  {
    name: 'Chemistry',
    items: [
      { label: 'n = m/M', latex: 'n = \\frac{m}{M}', desc: 'Moles from Mass' },
      { label: 'n = cV', latex: 'n = cV', desc: 'Moles from Concentration' },
      { label: 'c = n/V', latex: 'c = \\frac{n}{V}', desc: 'Concentration' },
      { label: 'c\u2081V\u2081=c\u2082V\u2082', latex: 'c_{1}V_{1} = c_{2}V_{2}', desc: 'Dilution' },
      { label: 'PV = nRT', latex: 'PV = nRT', desc: 'Ideal Gas Law' },
      { label: 'pH', latex: '\\text{pH} = -\\log[\\text{H}^{+}]', desc: 'pH' },
      { label: 'Yield %', latex: '\\%\\text{ yield} = \\frac{\\text{actual}}{\\text{theoretical}} \\times 100\\%', desc: 'Percentage Yield' },
      { label: 'K\u2093', latex: 'K_{a} = \\frac{[\\text{H}^{+}][\\text{A}^{-}]}{[\\text{HA}]}', desc: 'Acid Dissociation Constant' },
    ],
  },
];

export default function FormulaPalette({ editor, onClose }: FormulaPaletteProps) {
  const [activeCategory, setActiveCategory] = useState(categories[0].name);

  const insert = (template: string) => {
    if (!editor) return;
    const { from } = editor.state.selection;
    const text = `$${template}$`;
    editor.chain().focus().insertContentAt(from, text).run();
    const cursorOffset = template.indexOf('{}');
    if (cursorOffset !== -1) {
      const targetPos = from + 1 + cursorOffset + 1;
      editor.commands.setTextSelection({ from: targetPos, to: targetPos });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20" onClick={onClose}>
      <div
        className="bg-white border-2 border-slate-200 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[70vh] flex overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-44 bg-slate-50 border-r border-slate-100 overflow-y-auto p-3 shrink-0">
          {categories.map((cat) => (
            <button
              type="button"
              key={cat.name}
              onClick={() => setActiveCategory(cat.name)}
              className={`w-full text-left px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all mb-1 ${
                activeCategory === cat.name
                  ? 'bg-brand-green text-white shadow-md'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest">
              {activeCategory}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-all text-slate-400 hover:text-slate-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
            {categories
              .find((c) => c.name === activeCategory)
              ?.items.map((item) => (
                <button
                  type="button"
                  key={item.latex}
                  onClick={() => insert(item.latex)}
                  title={item.desc}
                  className="flex items-center justify-center h-12 rounded-xl bg-slate-50 border border-slate-100 hover:border-brand-green/40 hover:bg-green-50 hover:text-brand-green transition-all font-mono text-sm font-bold text-slate-700 active:scale-95"
                >
                  {item.label}
                </button>
              ))}
          </div>

          <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-xl">
            <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest">
              Tip: Click a symbol to insert it at cursor. Fill in the curly braces with your values.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
