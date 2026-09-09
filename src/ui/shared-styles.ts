/** Complete utility groups for shared controls, menus, dialogs and mode panels. */
export const sharedStyles = {
  'variant-heading':
    'tw:flex tw:items-center tw:justify-between tw:gap-6 tw:mb-3 tw:[&_h1]:text-[clamp(28px,_5vw,_42px)] tw:[&_h1]:[margin:10px_0] tw:[&_h1]:[letter-spacing:-1.5px] tw:[@media(max-width:_760px)]:gap-3',
  'variant-records':
    'tw:[padding:18px_0] tw:[border-top:1px_solid_var(--line)] tw:mt-8 tw:[&_ol]:list-none tw:[&_ol]:p-0 tw:[&_li]:flex tw:[&_li]:gap-4.5 tw:[&_li]:flex-wrap tw:[&_li]:justify-between tw:[&_li]:[border-bottom:1px_solid_var(--line)] tw:[&_li]:[padding:12px_0] tw:[&_li]:text-[12px] tw:[&_li]:text-muted',
  'variant-intro': 'tw:max-w-205 tw:[line-height:1.85] tw:text-[14px] tw:text-muted',
  'variant-storage': 'tw:[&:empty]:hidden tw:text-[var(--blue)] tw:text-[13px]',
  'choice-grid':
    'tw:grid tw:[grid-template-columns:repeat(3,_minmax(0,_1fr))] tw:gap-3 tw:[margin:16px_0_24px] tw:[@media(max-width:_760px)]:[grid-template-columns:minmax(0,_1fr)]',
  'choice-card':
    'tw:border tw:border-solid tw:border-line tw:rounded-xl tw:p-5 tw:text-left tw:bg-surface tw:flex tw:flex-col tw:gap-2.5 tw:[line-height:1.6] tw:[&_strong]:text-[15px] tw:[&_strong]:font-semibold tw:[&_span]:text-muted tw:[&_span]:text-[13px] tw:[&[aria-pressed=true]]:border-[var(--blue)] tw:[&[aria-pressed=true]]:[box-shadow:inset_0_0_0_1px_var(--blue)] tw:[&:not(:disabled):hover]:border-[var(--blue)] tw:[&:disabled]:[opacity:0.65] tw:[&>.dungeon-sprite]:w-12 tw:[&>.dungeon-sprite]:h-12 tw:[@media(max-width:_760px)]:p-4',
  'variant-metrics':
    'tw:flex tw:gap-7 tw:flex-wrap tw:[padding:12px_0] tw:[border-bottom:1px_solid_#dfe3df] tw:[margin:14px_0] tw:[&_div]:flex tw:[&_div]:flex-col tw:[&_div]:gap-2 tw:[&_div]:min-w-16 tw:[&_span]:text-[12px] tw:[&_span]:text-muted tw:[&_strong]:text-[23px] tw:[&_strong]:[font-family:var(--mono)] tw:[&_strong]:font-medium tw:[@media(min-width:_651px)_and_(max-width:_760px)]:gap-4  tw:[&_.variant-metric]:min-w-0 tw:[@media(max-width:_650px)]:gap-5.5',
  'variant-status': 'tw:text-[var(--blue)] tw:text-[15px] tw:[margin:22px_0]',
  'mirror-heading': 'tw:[grid-column:1_/_-1] tw:[&_h3]:[margin:0_0_12px]',
  'mirror-enemies':
    'tw:grid tw:[grid-template-columns:repeat(2,_minmax(0,_1fr))] tw:gap-3 tw:[@media(max-width:_480px)]:[grid-template-columns:minmax(0,_1fr)]',
  'mirror-enemy':
    'tw:flex tw:items-center tw:gap-3 tw:p-2.5 tw:border tw:border-solid tw:border-line tw:rounded-xl tw:[&.is-active]:border-[#bd944a] tw:[&.is-active[data-realm=dusk]]:border-[#7199ba] tw:[&>img]:[width:clamp(48px,_4vw,_80px)] tw:[&>img]:[height:clamp(48px,_4vw,_80px)] tw:[&_p]:text-muted tw:[&_p]:text-[0.85em] tw:[&_p]:[margin:5px_0_0] tw:[&.is-defeated>img]:[filter:grayscale(1)] tw:[&.is-defeated>img]:[opacity:0.45]',
  'variant-toolbar':
    'tw:[.variant-main:has(.expedition-layout)_&]:[gap:calc(12_*_var(--play-unit))] tw:flex tw:flex-col tw:[align-items:stretch] tw:gap-3',
  'twin-tools': 'tw:flex tw:justify-between tw:gap-3 tw:flex-wrap',
  'profession-preview':
    'tw:flex tw:items-center tw:gap-4 tw:p-4 tw:mt-3 tw:border tw:border-solid tw:border-line tw:[border-radius:14px] tw:bg-surface tw:[&>img]:w-14 tw:[&>img]:h-14 tw:[&>img]:[flex:0_0_56px] tw:[&>img]:object-contain tw:[&_p]:[margin:6px_0_0] tw:[&_p]:text-[12px] tw:[&_p]:[line-height:1.8] tw:[&_p]:text-muted tw:[&_small]:text-[var(--blue)] tw:[&_small]:text-[11px]',
  'profession-skill':
    'tw:[&_p]:[margin:6px_0_0] tw:[&_p]:text-[12px] tw:[&_p]:[line-height:1.8] tw:[&_p]:text-muted tw:border tw:border-solid tw:border-line tw:[border-radius:14px] tw:p-3.5 tw:bg-surface tw:[&_.skill-button]:grid tw:[&_.skill-button]:[place-items:center] tw:[&_.skill-button]:[flex:0_0_64px] tw:[&_.skill-button]:w-16 tw:[&_.skill-button]:h-16 tw:[&_.skill-button]:min-w-16 tw:[&_.skill-button]:p-1 tw:[&_.skill-button_img]:w-13.5 tw:[&_.skill-button_img]:h-13.5 tw:[&_.skill-button_img]:object-contain',
  'variant-note': 'tw:text-[12px] tw:[line-height:1.8] tw:text-muted tw:[&.reward-rate]:hidden',
  'scan-results': 'tw:list-none tw:p-0 tw:text-[13px] tw:[line-height:1.8]',
  'variant-pause':
    'tw:min-h-100 tw:flex tw:flex-col tw:items-center tw:[justify-content:center] tw:gap-4',
  'inventory-tool':
    'tw:relative tw:w-20.5 tw:h-20.5 tw:[flex:0_0_82px] tw:border tw:border-solid tw:border-line tw:[border-radius:14px] tw:bg-surface tw:[padding:6px_12px_23px] tw:[touch-action:none] tw:[user-select:none] tw:[cursor:grab] tw:[&:active]:[cursor:grabbing] tw:[&:hover:not(:disabled):not([aria-pressed=true])]:bg-surface-alt tw:[&:focus-visible]:[outline:2px_dashed_var(--muted)] tw:[&:focus-visible]:[outline-offset:4px] tw:[&[aria-pressed=true]]:border-[var(--blue)] tw:[&[aria-pressed=true]]:bg-[#eef2ff] tw:[&[aria-pressed=true]]:[box-shadow:0_0_0_1px_var(--blue)] tw:[&:disabled]:[opacity:0.45] tw:[&:disabled]:[cursor:default]',
  'tool-count':
    'tw:absolute tw:top-1 tw:right-1.5 tw:bg-surface tw:[border-radius:6px] tw:[padding:1px_4px] tw:text-[var(--blue)] tw:[font:12px_var(--mono)]',
  'tool-label': 'tw:absolute tw:[bottom:7px] tw:left-0 tw:w-full tw:text-center tw:text-[11px]',
  'variant-difficulty':
    'tw:[border:0] tw:p-0 tw:[margin:24px_0] tw:min-w-0 tw:[&_legend]:text-[13px] tw:[&_legend]:text-muted tw:[&_legend]:mb-3 tw:[&>div]:flex tw:[&>div]:flex-wrap tw:[&>div]:gap-2 tw:[&_button]:flex tw:[&_button]:[flex:1_1_120px] tw:[&_button]:flex-col tw:[&_button]:gap-1.5 tw:[&_button]:p-3 tw:[&_button]:border tw:[&_button]:border-solid tw:[&_button]:border-line tw:[&_button]:[border-radius:10px] tw:[&_button]:bg-surface tw:[&_button_span]:text-[11px] tw:[&_button_span]:text-muted tw:[&_button_strong]:[font-family:var(--sans)] tw:[&_button_strong]:text-[13px] tw:[&_button_strong]:font-medium tw:[&_button[aria-pressed=true]]:border-[var(--blue)] tw:[&_button[aria-pressed=true]]:bg-[#eef2ff]',
  'board-zoom':
    'tw:flex tw:gap-1.5 tw:items-center tw:flex-wrap tw:[margin:0_0_10px] tw:[&_.zoom-icon]:[display:inline-flex] tw:[&_.zoom-icon]:items-center tw:[&_.zoom-icon]:[justify-content:center] tw:[&_.zoom-icon]:gap-1 tw:[&_.zoom-icon]:w-14 tw:[&_.zoom-icon]:h-10 tw:[&_.zoom-icon]:border tw:[&_.zoom-icon]:border-solid tw:[&_.zoom-icon]:border-[#d2dbcf] tw:[&_.zoom-icon]:[border-radius:10px] tw:[&_.zoom-icon]:bg-[#fffef9] tw:[&_.zoom-icon]:text-[#365740] tw:[&_.zoom-icon]:cursor-pointer tw:[&_.zoom-icon_svg]:w-5 tw:[&_.zoom-icon_svg]:h-5 tw:[&_.zoom-icon_span]:text-[19px] tw:[&_.zoom-icon_span]:[line-height:1] tw:[&_.zoom-icon:disabled]:[opacity:0.35] tw:[&_.zoom-icon:disabled]:[cursor:default] tw:[@media(max-width:_900px)]:[&_.zoom-icon]:h-11',
  'magnetic-playbar':
    'tw:grid tw:gap-3 tw:[margin:0_0_12px] tw:[&_.tactical-controls]:sticky tw:[&_.tactical-controls]:top-2 tw:[&_.tactical-controls]:[z-index:12] tw:[&_.tactical-controls]:bg-surface tw:[&_.tactical-controls]:rounded-xl tw:[&_.tactical-controls]:p-1.5 tw:[&_.tactical-controls]:[box-shadow:0_2px_12px_#1e344710]',
  'magnetic-key':
    'tw:flex tw:items-center tw:gap-3.5 tw:[padding:10px_14px] tw:border tw:border-solid tw:border-[#b8d6df] tw:bg-[#f0f8fa] tw:rounded-xl tw:text-[#297287] tw:text-[0.85em] tw:[&[data-polarity=push]]:text-[#a8533e] tw:[&[data-polarity=push]]:border-[#e2bcaf] tw:[&[data-polarity=push]]:bg-[#fcf3ee] tw:[&[data-polarity=charge]]:text-[#926017] tw:[&[data-polarity=charge]]:border-[#ddc795] tw:[&[data-polarity=charge]]:bg-[#fbf6e8] tw:[&[data-polarity=recovery]]:text-muted tw:[&[data-polarity=recovery]]:border-line tw:[&[data-polarity=recovery]]:bg-surface',
  'magnetic-symbol':
    'tw:text-[1.6em] tw:whitespace-nowrap tw:[min-width:2.8em] tw:text-center tw:[line-height:1.4] tw:[&.vertical]:[transform:rotate(90deg)]',
  'clock-queue':
    'tw:p-3 tw:border tw:border-solid tw:border-[#9eacb9] tw:rounded-xl tw:bg-[#eaf2f7] tw:text-[#253e57] tw:text-[12px] tw:[&_ul]:pl-4.5 tw:[&_ul]:[margin:8px_0_0] tw:[&_li_+_li]:mt-1.5',
  'site-header': 'glass-panel',
  'site-footer':
    'tw:max-w-310 tw:m-auto tw:flex tw:items-center tw:justify-between tw:[padding:25px_40px] tw:[border-top:1px_solid_var(--line)] tw:text-[#8b908b] tw:text-[10px] tw:gap-4 tw:[&_a:hover]:text-[var(--blue)] tw:[&>div]:flex tw:[&>div]:items-center tw:[&>div]:gap-5.5 tw:[&>div>span]:flex tw:[&>div>span]:items-center tw:[&>div>span]:gap-1.5 tw:[&_.icon]:w-3 tw:[&_.icon]:h-3 tw:[&_.icon]:text-[#6e8b79] tw:[@media(max-width:_800px)]:[padding:22px_24px] tw:[@media(max-width:_800px)]:text-[9px] tw:[@media(max-width:_800px)]:flex-wrap tw:[@media(max-width:_800px)]:[justify-content:center] tw:[@media(max-width:_800px)]:[&>div]:gap-4',
  brand:
    'tw:[display:inline-flex] tw:items-center tw:gap-3 tw:text-[18px] tw:[font-weight:650] tw:[letter-spacing:-0.5px] tw:[@media(max-width:_480px)]:text-[15px] tw:[@media(max-width:_480px)]:gap-2',
  'brand-mark':
    'tw:w-8.5 tw:h-8.5 tw:grid tw:[place-items:center] tw:[border:1.5px_solid_var(--ink)] tw:[border-radius:9px] tw:text-[var(--blue)] tw:[transform:rotate(-6deg)] tw:[&_.icon]:w-5 tw:[&_.icon]:[transform:rotate(6deg)] tw:[@media(max-width:_480px)]:w-7 tw:[@media(max-width:_480px)]:h-7',
  'brand-version':
    'tw:inline-block tw:[font-family:var(--mono)] tw:text-[10px] tw:[padding:3px_5px] tw:border tw:border-solid tw:border-line tw:[border-radius:4px] tw:[margin-left:9px] tw:text-muted tw:[vertical-align:middle] tw:[letter-spacing:0] tw:[@media(max-width:_480px)]:hidden',
  'text-button': 'tw:text-[13px] tw:[padding:8px_0] tw:text-muted tw:[&:hover]:text-[var(--blue)]',
  'language-picker':
    'tw:relative tw:[margin-left:7px] tw:[padding-left:25px] tw:[border-left:1px_solid_var(--line)] tw:[@media(min-width:_481px)_and_(max-width:_800px)]:[padding-left:15px] tw:[@media(max-width:_480px)]:m-0 tw:[@media(max-width:_480px)]:pl-3 tw:[@media(max-width:_480px)]:gap-0.5',
  'language-trigger':
    'tw:flex tw:items-center tw:gap-2 tw:min-h-10 tw:[padding:0_9px] tw:rounded-lg tw:text-[12px] tw:text-muted tw:[transition:background_150ms,_color_150ms] tw:[&:hover]:bg-[var(--blue-tint)] tw:[&:hover]:text-[var(--blue)] tw:[&[aria-expanded=true]]:bg-[var(--blue-tint)] tw:[&[aria-expanded=true]]:text-[var(--blue)] tw:[&_.icon]:w-4 tw:[&_.icon-chevron]:[width:13px] tw:[&_.icon-chevron]:[transition:transform_150ms] tw:[&[aria-expanded=true]_.icon-chevron]:[transform:rotate(180deg)] tw:[@media(max-width:_480px)]:gap-1 tw:[@media(max-width:_480px)]:[padding:0_5px]',
  'language-menu':
    'tw:absolute tw:[top:calc(100%_+_8px)] tw:right-0 tw:[z-index:30] tw:w-43 tw:[padding:7px] tw:border tw:border-solid tw:border-line tw:rounded-xl tw:bg-surface tw:[box-shadow:0_12px_32px_#2d343214,_0_2px_6px_#2d343208]',
  'language-option':
    'tw:flex tw:items-center tw:justify-between tw:w-full tw:min-h-10.5 tw:[padding:0_12px] tw:[border-radius:7px] tw:text-[13px] tw:text-left tw:[&:hover]:bg-surface-alt tw:[&:focus-visible]:bg-surface-alt tw:[&[aria-checked=true]]:text-[var(--blue)] tw:[&[aria-checked=true]]:bg-[var(--blue-tint)] tw:[&[aria-checked=true]]:font-semibold tw:[&_.icon]:[width:15px] tw:[&_.icon]:invisible tw:[&[aria-checked=true]_.icon]:visible',
  'game-heading-actions': 'tw:flex tw:items-center tw:gap-1.5',
  layout:
    'tw:max-w-370 tw:[margin:65px_auto_64px] tw:[padding:0_32px] tw:grid tw:[grid-template-columns:clamp(200px,_22vw,_280px)_minmax(0,_1fr)] tw:[gap:clamp(32px,_5vw,_72px)] tw:[align-items:start] tw:[&.wide-board]:max-w-400 tw:[@media(max-width:_1000px)]:gap-10 tw:[@media(max-width:_1000px)]:[grid-template-columns:230px_minmax(0,_1fr)] tw:[@media(min-width:_801px)_and_(max-height:_850px)]:mt-5.5 tw:[@media(min-width:_801px)_and_(max-height:_850px)]:mb-7 tw:[@media(max-width:_800px)]:max-w-155 tw:[@media(max-width:_800px)]:block tw:[@media(min-width:_481px)_and_(max-width:_800px)]:[margin:26px_auto_40px] tw:[@media(min-width:_481px)_and_(max-width:_800px)]:[padding:0_24px] tw:[@media(max-width:_480px)]:[padding:0_16px] tw:[@media(max-width:_480px)]:[margin:20px_auto_40px] tw:[@media(min-width:_801px)_and_(max-width:_1250px)]:[&.wide-board]:block tw:[@media(min-width:_801px)_and_(max-width:_1250px)]:[&.wide-board]:max-w-300',
  introduction:
    'tw:pt-10 tw:[@media(min-width:_801px)_and_(max-height:_850px)]:pt-9 tw:[@media(max-width:_800px)]:grid tw:[@media(min-width:_481px)_and_(max-width:_800px)]:[grid-template-columns:1fr_150px] tw:[@media(max-width:_800px)]:pt-0 tw:[@media(min-width:_481px)_and_(max-width:_800px)]:mb-7.5 tw:[@media(min-width:_481px)_and_(max-width:_800px)]:[column-gap:10px] tw:[@media(max-width:_800px)]:[&_.eyebrow]:hidden tw:[@media(max-width:_480px)]:[grid-template-columns:1fr_102px] tw:[@media(max-width:_480px)]:gap-2 tw:[@media(max-width:_480px)]:mb-6',
  eyebrow:
    'tw:[dialog_&]:text-[9px] tw:[dialog_&]:mb-[17px] tw:flex tw:items-center tw:[gap:9px] tw:[font:10px/1.5_var(--mono)] tw:[letter-spacing:1.6px] tw:text-muted tw:[margin:0_0_24px] tw:[&>span]:[width:5px] tw:[&>span]:[height:5px] tw:[&>span]:bg-[var(--blue)] tw:[&>span]:[border-radius:50%]',
  'intro-copy':
    'tw:text-muted tw:text-[14px] tw:[line-height:1.95] tw:[max-width:265px] tw:m-0 tw:[@media(max-width:_800px)]:text-[12px] tw:[@media(max-width:_800px)]:[line-height:1.85] tw:[@media(max-width:_800px)]:max-w-none tw:[@media(max-width:_480px)]:hidden',
  'hero-art':
    'tw:block tw:w-80 tw:h-80 tw:[max-width:118%] tw:object-contain tw:[margin:0_0_-18px_-20px] tw:[mix-blend-mode:multiply] tw:[mask-image:radial-gradient(ellipse_at_center,_#000_50%,_transparent_73%)] tw:[@media(min-width:_801px)_and_(max-width:_1000px)_and_(min-height:_851px)]:w-67.5 tw:[@media(min-width:_801px)_and_(max-width:_1000px)_and_(min-height:_851px)]:h-67.5 tw:[@media(min-width:_801px)_and_(max-height:_850px)]:w-70 tw:[@media(min-width:_801px)_and_(max-height:_850px)]:h-70 tw:[@media(max-width:_800px)]:[grid-column:2] tw:[@media(min-width:_481px)_and_(max-width:_800px)]:[grid-row:1_/_3] tw:[@media(min-width:_481px)_and_(max-width:_800px)]:w-42.5 tw:[@media(min-width:_481px)_and_(max-width:_800px)]:h-42.5 tw:[@media(min-width:_481px)_and_(max-width:_800px)]:[margin:-10px_-10px] tw:[@media(max-width:_800px)]:[align-self:center] tw:[@media(max-width:_480px)]:w-27.5 tw:[@media(max-width:_480px)]:h-27.5 tw:[@media(max-width:_480px)]:[margin:-10px_-7px] tw:[@media(max-width:_480px)]:[grid-row:1]',
  'intro-bottom':
    'tw:flex tw:items-center tw:[gap:13px] tw:[&_p]:text-muted tw:[&_p]:text-[11px] tw:[&_p]:[letter-spacing:0.4px] tw:[@media(max-width:_800px)]:hidden',
  'tiny-rule': 'tw:[width:23px] tw:[height:1px] tw:bg-muted',
  'game-section': 'tw:min-w-0',
  'game-heading':
    'tw:flex tw:justify-between tw:items-center tw:[margin-bottom:19px] tw:[&_h2]:text-[22px] tw:[&_h2]:font-semibold tw:[&_h2]:[letter-spacing:-0.7px] tw:[&_h2]:m-0 tw:[@media(min-width:_801px)_and_(max-height:_850px)]:mb-2 tw:[@media(max-width:_480px)]:mb-3 tw:[@media(max-width:_480px)]:[&_h2]:text-[19px]',
  'icon-button':
    'tw:[&#sound-button[aria-pressed=true]]:text-[var(--blue)] tw:[display:inline-grid] tw:[place-items:center] tw:w-8.5 tw:h-8.5 tw:[border-radius:7px] tw:text-muted tw:[&:hover]:bg-surface-alt tw:[&:hover]:text-ink',
  'difficulty-tabs':
    'tw:flex tw:gap-1 tw:mb-4.5 tw:bg-surface-alt tw:border tw:border-solid tw:border-line tw:[border-radius:10px] tw:p-1 tw:[&_button]:[flex:1] tw:[&_button]:min-w-0 tw:[&_button]:[padding:10px_4px] tw:[&_button]:[border-radius:6px] tw:[&_button]:text-[12px] tw:[&_button]:text-muted tw:[&_button]:[transition:background_0.15s] tw:[&_button_span]:block tw:[&_button_span]:mt-1 tw:[&_button_span]:[font:9px_var(--mono)] tw:[&_button_span]:text-muted tw:[&_button_span]:[letter-spacing:0.1px] tw:[&_button.selected]:text-[var(--blue)] tw:[&_button.selected]:bg-surface tw:[&_button.selected]:[box-shadow:0_1px_3px_#2221] tw:[&_button.selected_span]:text-[var(--blue)] tw:[&_button.selected_span]:[opacity:0.7] tw:[@media(min-width:_801px)_and_(max-height:_850px)]:mb-2.5 tw:[@media(min-width:_801px)_and_(max-height:_850px)]:[&_button]:py-1.5 tw:[@media(max-width:_480px)]:mb-3 tw:[@media(max-width:_480px)]:[&_button]:text-[11px] tw:[@media(max-width:_480px)]:[&_button]:[padding:9px_2px] tw:[@media(max-width:_480px)]:[&_button_span]:text-[8px]',
  'game-card':
    'tw:border tw:border-solid tw:border-line tw:[border-radius:15px] tw:bg-surface tw:[box-shadow:0_4px_24px_#252a3204] tw:[overflow:clip]',
  'score-strip':
    'tw:flex tw:[justify-content:space-around] tw:[padding:24px_16px_22px] tw:[border-bottom:1px_solid_var(--line)] tw:[&>div]:[flex:1] tw:[&>div]:text-center tw:[&>div_+_div]:[border-left:1px_solid_var(--line)] tw:[&_span]:flex tw:[&_span]:items-center tw:[&_span]:[justify-content:center] tw:[&_span]:gap-1.5 tw:[&_span]:text-[10px] tw:[&_span]:text-muted tw:[&_span]:[margin-bottom:9px] tw:[&_.icon]:[width:13px] tw:[&_.icon]:[height:13px] tw:[&_strong]:block tw:[&_strong]:[font:25px/1_var(--mono)] tw:[&_strong]:[font-weight:450] tw:[&_strong]:[letter-spacing:-0.8px] tw:[&_strong]:[font-variant-numeric:tabular-nums] tw:[@media(min-width:_801px)_and_(max-height:_850px)]:[padding-block:15px] tw:[@media(min-width:_801px)_and_(max-height:_850px)]:[&_strong]:text-[22px] tw:[@media(min-width:_801px)_and_(max-height:_850px)]:[&_span]:[margin-bottom:7px] tw:[@media(max-width:_480px)]:[padding:19px_7px] tw:[@media(max-width:_480px)]:[&_strong]:text-[23px] tw:[@media(max-width:_480px)]:[&_span]:text-[9px]',
  'status-line':
    'tw:flex tw:items-center tw:[gap:7px] tw:[padding:12px_22px] tw:min-h-10.5 tw:[border-top:1px_solid_var(--line)] tw:text-muted tw:text-[11px] tw:[@media(min-width:_801px)_and_(max-height:_850px)]:min-h-8 tw:[@media(min-width:_801px)_and_(max-height:_850px)]:py-2 tw:[@media(max-width:_480px)]:[padding:11px_14px] tw:[@media(max-width:_480px)]:text-[10px] tw:[@media(max-width:_480px)]:[gap:5px]',
  'status-dot':
    'tw:[width:5px] tw:[height:5px] tw:[border-radius:50%] tw:bg-[#a0a5a0] tw:shrink-0 tw:[&[data-phase=playing]]:bg-[var(--blue)] tw:[&[data-phase=won]]:bg-[#4b8872] tw:[&[data-phase=lost]]:bg-[#bf6851]',
  'game-toolbar':
    'tw:flex tw:[justify-content:flex-end] tw:items-center tw:[padding:14px_18px] tw:[border-top:1px_solid_var(--line)] tw:[@media(min-width:_801px)_and_(max-height:_850px)]:[padding-block:9px] tw:[@media(max-width:_480px)]:[padding:12px_11px]',
  'board-help': 'tw:[&_ul]:[padding-left:1.25em] tw:[&_ul]:[line-height:1.8] tw:[&_details]:mt-4',
  'toolbar-right':
    'tw:flex tw:gap-2 tw:items-center tw:[&_.icon]:[width:17px] tw:[&_.icon]:[height:17px] tw:[@media(max-width:_480px)]:[gap:3px]',
  'new-button':
    'tw:[display:inline-flex] tw:items-center tw:[gap:7px] tw:bg-ink tw:text-[white] tw:[padding:10px_13px] tw:text-[11px] tw:[border-radius:6px] tw:[&:hover]:bg-[#464c4b] tw:[@media(max-width:_480px)]:p-2.5 tw:[@media(max-width:_480px)]:text-[10px] tw:[@media(max-width:_480px)]:[gap:5px]',
  'under-board':
    'tw:text-center tw:text-[#8a8f8c] tw:text-[10px] tw:[margin:20px_0_0] tw:[line-height:1.8] tw:[&_p]:[margin:3px_0] tw:[@media(min-width:_801px)_and_(max-height:_850px)]:mt-2.5 tw:[@media(max-width:_480px)]:mt-3.5 tw:[@media(max-width:_480px)]:text-[9px]',
  'touch-hint': 'tw:hidden tw:[@media(pointer:_coarse)]:block',
  'scroll-hint': 'tw:text-center tw:text-muted tw:text-[10px]',
  'storage-note': 'tw:text-[#a04e31] tw:text-[12px]',
  'pause-cover':
    'tw:absolute tw:[inset:0] tw:flex tw:flex-col tw:items-center tw:[justify-content:center] tw:text-center tw:bg-[#fafaf7] tw:p-5 tw:[&_h3]:text-[23px] tw:[&_h3]:font-medium tw:[&_h3]:[margin:0_0_12px] tw:[&_p]:text-[12px] tw:[&_p]:text-muted tw:[&_p]:[margin:0_0_24px]',
  'pause-art':
    'tw:text-[#738f7d] tw:mb-3 tw:[&_.icon]:w-10.5 tw:[&_.icon]:h-10.5 tw:[&_.icon]:[stroke-width:1]',
  'dialog-close': 'tw:absolute tw:top-3 tw:right-3',
  'dialog-intro': 'tw:text-muted tw:text-[13px] tw:[line-height:1.9] tw:[margin:0_0_26px]',
  'help-list':
    'tw:list-none tw:p-0 tw:m-0 tw:[&_li]:flex tw:[&_li]:gap-4.5 tw:[&_li]:[margin:23px_0] tw:[&_li>span]:[font:11px_var(--mono)] tw:[&_li>span]:text-[var(--blue)] tw:[&_li>span]:[padding-top:3px] tw:[&_h3]:text-[14px] tw:[&_h3]:[margin:0_0_7px] tw:[&_h3]:font-semibold tw:[&_p]:text-[12px] tw:[&_p]:text-muted tw:[&_p]:[line-height:1.9] tw:[&_p]:m-0',
  'safe-note':
    'tw:[border-top:1px_solid_var(--line)] tw:pt-4.5 tw:flex tw:items-center tw:[gap:9px] tw:text-[11px] tw:text-[#5f856f] tw:[&_.icon]:[width:15px]',
  'primary-button':
    'tw:[display:inline-flex] tw:items-center tw:[justify-content:center] tw:[gap:9px] tw:[padding:12px_18px] tw:[border-radius:7px] tw:text-[12px] tw:bg-[var(--blue)] tw:text-[white] tw:[&:hover]:bg-[#2844b2] tw:[&_.icon]:w-4 tw:[&_.icon]:h-4',
  'secondary-button':
    'tw:[display:inline-flex] tw:items-center tw:[justify-content:center] tw:[gap:9px] tw:[padding:12px_18px] tw:[border-radius:7px] tw:text-[12px] tw:border tw:border-solid tw:border-line tw:bg-surface tw:[&:hover]:border-[#bfc5bc]',
  'dialog-actions': 'tw:flex tw:gap-3 tw:[justify-content:flex-end]',
  'record-tabs':
    'tw:flex tw:gap-5 tw:[border-bottom:1px_solid_var(--line)] tw:[&_button]:text-[12px] tw:[&_button]:[padding:10px_0] tw:[&_button]:text-muted tw:[&_button]:[border-bottom:2px_solid_transparent] tw:[&_button[aria-pressed=true]]:text-[var(--blue)] tw:[&_button[aria-pressed=true]]:border-[var(--blue)]',
  'records-table':
    'tw:w-full tw:text-[12px] tw:[border-collapse:collapse] tw:[&_th]:text-left tw:[&_th]:text-muted tw:[&_th]:font-normal tw:[&_th]:[padding:15px_4px] tw:[&_th]:text-[10px] tw:[&_td]:[padding:14px_4px] tw:[&_td]:[border-top:1px_solid_var(--line)] tw:[&_td]:max-w-37.5 tw:[&_td]:[overflow-wrap:anywhere] tw:[&_td:nth-child(1)]:[font-family:var(--mono)] tw:[&_td:nth-child(1)]:text-[var(--blue)] tw:[&_td:nth-child(3)]:[font-family:var(--mono)] tw:[&_td:last-child]:text-[10px] tw:[&_td:last-child]:whitespace-nowrap tw:[&_td:last-child]:text-muted',
  'empty-records':
    'tw:[padding:50px_0_30px] tw:text-center tw:text-[12px] tw:text-muted tw:[&_.icon]:[width:35px] tw:[&_.icon]:[height:35px] tw:[&_.icon]:[stroke-width:1] tw:[&_.icon]:mb-3',
  'custom-fields':
    'tw:flex tw:gap-3 tw:[&_label]:[flex:1] tw:[&_label]:min-w-0 tw:[&_label]:text-[12px] tw:[&_label]:text-muted tw:[&_input]:mt-2.5 tw:[&_input]:[font:18px_var(--mono)] tw:[@media(max-width:_480px)]:gap-2',
  'form-error': 'tw:text-[12px] tw:text-[#b24f3b] tw:min-h-4.5',
  'result-symbol':
    'tw:w-14.5 tw:h-14.5 tw:border tw:border-solid tw:border-[#e4d4c9] tw:[border-radius:15px] tw:bg-[#f4e8de] tw:text-[#a26850] tw:grid tw:[place-items:center] tw:mb-6 tw:[transform:rotate(-5deg)] tw:[&.win]:bg-[var(--blue-tint)] tw:[&.win]:border-[#d7def2] tw:[&.win]:text-[var(--blue)] tw:[&_.icon]:w-7.5 tw:[&_.icon]:h-7.5 tw:[&_.icon]:[stroke-width:1.3] tw:[&_.icon]:[transform:rotate(5deg)]',
  'result-time':
    'tw:[font:34px_var(--mono)] tw:[margin:20px_0] tw:[&_span]:block tw:[&_span]:text-muted tw:[&_span]:[font:11px_var(--sans)] tw:[&_span]:[margin-top:7px]',
  'saved-label':
    'tw:flex tw:items-center tw:[gap:5px] tw:text-[11px] tw:text-[#63856b] tw:[&_.icon]:[width:13px] tw:[&_.icon]:[height:13px]',
  'name-field':
    'tw:flex tw:gap-2 tw:[&_input]:min-w-0 tw:[&_input]:text-[13px] tw:[&_button]:whitespace-nowrap',
  'result-restart': 'tw:[margin-top:25px]',
  'language-current': 'tw:[@media(max-width:_480px)]:hidden',
  'desktop-hint': 'tw:[@media(pointer:_coarse)]:hidden',
  'tutorial-entry': 'tw:[&.text-button]:text-[#355d42] tw:text-[#355d42] tw:font-semibold',
  'board-frame-heading':
    'tw:flex tw:items-center tw:justify-between tw:gap-3 tw:mb-3.5 tw:[&_.board-zoom]:shrink-0 tw:[&_.board-zoom]:m-0 tw:[&_.board-zoom_.zoom-icon]:w-11 tw:[&_.board-zoom_.zoom-icon]:h-9 tw:[&_.board-zoom_.zoom-icon]:gap-0.5 tw:[&_.board-zoom_.zoom-icon]:bg-[#f4f7ee] tw:[&_.board-zoom_.zoom-icon_svg]:[width:17px] tw:[&_.board-zoom_.zoom-icon_svg]:[height:17px] tw:[@media(max-width:_900px)]:[&_.board-zoom_.zoom-icon]:h-11',
  'milestone-toast':
    'tw:[&.is-complete_.toast-symbol]:text-[#327b54] tw:[&.is-complete_.toast-content_small]:text-[#327b54] tw:[&.is-complete_progress]:[accent-color:#3c9466] tw:[position:fixed] tw:[z-index:100] tw:[top:max(16px,_env(safe-area-inset-top))] tw:[left:50%] tw:[transform:translateX(-50%)] tw:flex tw:items-center tw:gap-3.5 tw:[width:min(440px,_calc(100vw_-_24px))] tw:[box-sizing:border-box] tw:[padding:17px] tw:border tw:border-solid tw:border-[#d9cba9] tw:rounded-2xl tw:bg-[#fffdf6] tw:text-[#443c2c] tw:[box-shadow:0_12px_40px_#28352b26] tw:[animation:notice-arrive_0.2s_ease-out] tw:[&[hidden]]:hidden tw:[&_button]:[align-self:flex-start] tw:[&_button]:[border:0] tw:[&_button]:bg-transparent tw:[&_button]:text-[#80745a] tw:[&_button]:cursor-pointer tw:[&_button]:min-w-8 tw:[&_button]:min-h-8 tw:[&_button]:[border-radius:7px] tw:[&_button]:text-[1.25rem] tw:[&_button:hover]:bg-[#eee5d2] tw:[&.is-complete]:bg-[#f5fcf7] tw:[&.is-complete]:border-[#b3d4bf] tw:[@media(prefers-reduced-motion:_reduce)]:[animation:none]',
  'toast-symbol': 'tw:text-[1.6rem] tw:text-[#98722a]',
  'toast-content':
    'tw:[flex:1] tw:min-w-0 tw:[&_small]:block tw:[&_small]:text-[#81714f] tw:[&_small]:mb-1 tw:[&_strong]:block tw:[&_strong]:[overflow-wrap:anywhere]',
  'toast-progress':
    'tw:flex tw:items-center tw:gap-3 tw:mt-2.5 tw:[&_progress]:[flex:1] tw:[&_progress]:min-w-0 tw:[&_progress]:w-full tw:[&_progress]:[height:7px] tw:[&_progress]:[border:0] tw:[&_progress]:[border-radius:5px] tw:[&_progress]:overflow-hidden tw:[&_progress]:[accent-color:#b98b37] tw:[&_progress::-webkit-progress-bar]:bg-[#e9e4d8] tw:[&_progress::-webkit-progress-bar]:[border-radius:5px] tw:[&_progress::-webkit-progress-value]:bg-[#b98b37] tw:[&_progress::-webkit-progress-value]:[border-radius:5px] tw:[&_span]:whitespace-nowrap tw:[&_span]:text-[0.8rem] tw:[&_span]:[font-variant-numeric:tabular-nums]',
  'camp-panel':
    'tw:[&_h1]:text-[clamp(28px,_5vw,_42px)] tw:[&_h1]:[margin:10px_0] tw:[&_h1]:[letter-spacing:-1.5px] tw:mt-7 tw:[&_:where(h2)]:[margin:32px_0_14px] tw:[&_:where(h2)]:text-[17px] tw:[&_:where(h2)]:font-semibold tw:[&_h2_small]:text-[12px] tw:[&_h2_small]:text-muted tw:[&_h2_small]:ml-3 tw:[&>.primary-button]:mt-6',
  'skill-landings': 'tw:flex tw:flex-wrap tw:[gap:0.5rem]',
}
