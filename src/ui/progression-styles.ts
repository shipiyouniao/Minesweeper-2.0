/** Complete utility classes for the progression UI; semantic hooks stay in templates. */
export const progressionStyles = {
  'title-cabinet': ['tw:relative tw:[margin:0_0_18px] tw:max-w-90 tw:text-[#4e513f]'].join(' '),
  'title-choice': ['tw:relative'].join(' '),
  'title-effect': [
    'tw:[margin:8px_0_0] tw:text-[0.8rem] tw:[line-height:1.6] tw:[overflow-wrap:anywhere]',
    'tw:[&_small]:block tw:[&_small]:[margin-top:3px] tw:[&_small]:text-[0.74rem] tw:[&_small]:[line-height:1.5] tw:[&_small]:text-[#737866]',
  ].join(' '),
  'title-options': [
    'tw:[&_small]:block tw:[&_small]:[margin-top:3px] tw:[&_small]:text-[0.74rem] tw:[&_small]:[line-height:1.5] tw:[&_small]:text-[#737866]',
    'tw:absolute tw:[z-index:40] tw:[top:calc(100%_+_6px)] tw:left-0 tw:right-0 tw:[padding:5px] tw:max-h-70 tw:overflow-y-auto tw:[overscroll-behavior:contain] tw:[scrollbar-width:thin] tw:[scrollbar-color:#bac1af_transparent] tw:border tw:border-solid tw:border-[#d8ddd1] tw:rounded-xl tw:bg-[#fffefa] tw:[box-shadow:0_12px_32px_#293b251c,0_2px_6px_#293b250a]',
    'tw:[&.opens-up]:top-auto tw:[&.opens-up]:[bottom:calc(100%_+_6px)]',
    'tw:[&_button]:flex tw:[&_button]:w-full tw:[&_button]:items-center tw:[&_button]:gap-2.5 tw:[&_button]:min-h-11 tw:[&_button]:[padding:9px_10px] tw:[&_button]:[border:0] tw:[&_button]:[border-radius:7px] tw:[&_button]:bg-transparent tw:[&_button]:text-inherit tw:[&_button]:text-left tw:[&_button]:text-[0.85rem] tw:[&_button]:cursor-pointer',
    'tw:[&_button>span:nth-child(2)]:[flex:1] tw:[&_button>span:nth-child(2)]:min-w-0 tw:[&_button>span:nth-child(2)]:[overflow-wrap:anywhere]',
    'tw:[&_button:hover]:bg-[#eff2e9] tw:[&_button:hover]:[outline:1px_solid_#b6c2a8] tw:[&_button:hover]:[outline-offset:-1px]',
    'tw:[&_button:focus-visible]:bg-[#eff2e9] tw:[&_button:focus-visible]:[outline:1px_solid_#b6c2a8] tw:[&_button:focus-visible]:[outline-offset:-1px]',
    'tw:[&_button[aria-checked=true]]:bg-[#e8edde] tw:[&_button[aria-checked=true]]:text-[#455b38]',
  ].join(' '),
  'title-label': ['tw:block tw:[margin:0_0_7px] tw:text-[0.72rem] tw:text-[#777b6a]'].join(' '),
  'title-trigger': [
    'tw:flex tw:items-center tw:w-full tw:min-h-11.5 tw:gap-2.5 tw:[padding:10px_13px] tw:border tw:border-solid tw:border-[#d5d8ce] tw:[border-radius:10px] tw:bg-[#fffefa] tw:text-inherit tw:text-left tw:cursor-pointer tw:text-[0.88rem]',
    'tw:[&:hover]:border-[#a3ae97] tw:[&:hover]:bg-[#fbfcf7]',
    'tw:[&[aria-expanded=true]]:border-[#a3ae97] tw:[&[aria-expanded=true]]:bg-[#fbfcf7]',
    'tw:[&>#title-value]:[flex:1] tw:[&>#title-value]:min-w-0 tw:[&>#title-value]:[overflow-wrap:anywhere]',
    'tw:[&[aria-expanded=true]_.title-chevron]:[margin-bottom:-3px] tw:[&[aria-expanded=true]_.title-chevron]:[transform:rotate(225deg)]',
  ].join(' '),
  'title-chevron': [
    'tw:[width:7px] tw:[height:7px] tw:[margin:0_2px_3px_6px] tw:[border-right:1.5px_solid_currentColor] tw:[border-bottom:1.5px_solid_currentColor] tw:[transform:rotate(45deg)]',
  ].join(' '),
  'title-emblem': ['tw:text-[1.15rem] tw:text-[#9c804b]'].join(' '),
  'title-option-icon': ['tw:w-4.5 tw:text-[#a18a5b] tw:text-center'].join(' '),
  'title-check': ['tw:invisible tw:text-[0.9rem]', 'tw:[[aria-checked=true]>&]:visible'].join(' '),
  'title-empty': ['tw:[padding:8px_10px] tw:m-0 tw:text-[#7b8171] tw:text-[0.78rem]'].join(' '),
  'title-reward': [
    'tw:block tw:[width:fit-content] tw:bg-[#f2e8cf] tw:text-[#6a5023] tw:[padding:6px_10px] tw:rounded-lg tw:mb-2.5',
  ].join(' '),
}
