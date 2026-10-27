# Face Up rules

Each rule's severity, anchors, what the scanner checks, and "Judgement" when a person must decide. "Scanner: none" means the scanner does not check the rule, so its silence means nothing. Read the rule's file in `catalogue/` before checking it.

- **faceup-action-on-focus**: Moving focus onto a control triggers an action. Tabbing onto a field or button opens a window, submits the form, moves focus or loads a page. Act only when the person clicks, presses a key or changes a value.
  Accessibility failure. WCAG 3.2.1 On Focus (Level A); Heuristic: Nielsen: user control and freedom. Scanner: none.
- **faceup-action-on-press**: Action fires on press, before release. A delete button acts the moment it is pressed, so a slip cannot be cancelled. Run the action on release, which onClick already does.
  Accessibility failure. WCAG 2.5.2 Pointer Cancellation (Level A). Scanner: none.
- **faceup-aria-references-missing-id**: Label or description points to an element that is not there. A button or field takes its name or hint from text that is not on the page, so a screen reader has nothing to read. Add the missing text or name the control directly.
  Accessibility failure. WCAG 4.1.2 Name, Role, Value (Level A). Scanner: browser.
- **faceup-async-status-not-announced**: Loading and saving status is not announced. A save shows a spinner and 'Saved' on screen, but a screen reader hears none of it. Put the status in an area marked for announcements so each change is read out.
  Accessibility failure. WCAG 4.1.3 Status Messages (Level AA). Scanner: none.
- **faceup-autocomplete-missing**: Personal details fields have no autocomplete. Personal details fields do not tell the browser what they hold, so it cannot fill them in reliably. Give each field the autocomplete value that names its purpose.
  Accessibility failure. WCAG 1.3.5 Identify Input Purpose (Level AA); Heuristic: Nielsen: recognition rather than recall. Scanner: none.
- **faceup-autofocus-misused**: Page moves focus to a field on load. The page moves keyboard focus to a field far down on load, so the person lands somewhere they did not choose. Let the page open at the top.
  UX failure. Heuristic: Nielsen: user control and freedom. Scanner: none.
- **faceup-autoplay-media-no-control**: Audio or video plays on load with no controls. Video or audio starts by itself when the page loads, with nothing to pause or stop it. Mute anything that must start on load and give it controls, or let the person start it.
  Accessibility failure. WCAG 1.4.2 Audio Control (Level A); WCAG 2.2.2 Pause, Stop, Hide (Level A); Heuristic: Nielsen: user control and freedom. Scanner: browser.
- **faceup-back-discards-data**: Going back clears what the person entered. Going back a step in a form wipes what the person typed, so they have to enter it again. Keep every step's answers in one place that lasts for the whole process.
  Accessibility failure. WCAG 3.3.7 Redundant Entry (Level A); Heuristic: Nielsen: user control and freedom. Scanner: none.
- **faceup-cognitive-auth-test**: Login depends on memory or a puzzle. Login asks the person to remember a code and blocks pasting, so password managers cannot fill it in. Let the field accept pasting and autofill, or offer another way to log in.
  Accessibility failure. WCAG 3.3.8 Accessible Authentication (Minimum) (Level AA); Heuristic: Nielsen: recognition rather than recall. Scanner: none.
- **faceup-colour-only-signal**: Colour alone marks an error or a link. A field turns red to show an error, or paragraph links differ from text only by colour. Add a non-colour signal, such as a message, an icon or an underline.
  Accessibility failure. WCAG 1.4.1 Use of Colour (Level A); WCAG 3.3.1 Error Identification (Level A); Heuristic: Nielsen: visibility of system status. Scanner: none.
- **faceup-consistent-help**: Help is in a different place on each page. The help link sits in the header on one page, the footer on the next, and is missing on the third. Put help in one shared layout.
  Accessibility failure. WCAG 3.2.6 Consistent Help (Level A); Heuristic: Nielsen: consistency and standards. Scanner: none.
- **faceup-context-change-on-input**: Changing a field opens a new page. Picking an option from a list sends the person to a new page with no warning. Let them choose first, then act with a separate Go button.
  Accessibility failure. WCAG 3.2.2 On Input (Level A). Scanner: none.
- **faceup-control-missing-name**: Button or link has no name. An icon-only button or link has no name, so a screen reader announces only 'button' or 'link'. Add a name that is read out, with aria-label or text hidden on screen.
  Accessibility failure. WCAG 4.1.2 Name, Role, Value (Level A); WCAG 2.4.4 Link Purpose (In Context) (Level A). Scanner: code and browser.
- **faceup-destructive-no-undo**: Delete cannot be undone. Pressing delete removes the item at once, with no undo, bin or archive. Give people a way back, such as an undo button.
  UX failure. Heuristic: Nielsen: user control and freedom; Heuristic: Nielsen: error prevention. Scanner: none. Judgement.
- **faceup-disabled-submit-no-reason**: Disabled submit button gives no reason. The submit button stays greyed out until every field is correct, and nothing says what is missing. Keep the button working and list what to fix when someone presses it.
  UX failure. Heuristic: Nielsen: help users recognise, diagnose, and recover from errors; Heuristic: Nielsen: visibility of system status. Scanner: none.
- **faceup-div-as-button**: Clickable element that is not a button. Something looks like a button but is a plain box with a click action, so keyboards and screen readers cannot use it. Use a real button.
  Accessibility failure. WCAG 4.1.2 Name, Role, Value (Level A); WCAG 2.1.1 Keyboard (Level A). Scanner: code.
- **faceup-dragging-no-alternative**: Reordering only works by dragging. A list can only be reordered by dragging, which some people cannot do. Keep dragging and add up and down buttons that work with a single click or tap.
  Accessibility failure. WCAG 2.5.7 Dragging Movements (Level AA). Scanner: none.
- **faceup-error-not-identified**: Error message is vague and not linked to its field. An error under a field is not linked to it and only says 'Invalid input'. Link the message to the field and say how to fix the problem.
  Accessibility failure. WCAG 3.3.3 Error Suggestion (Level AA); Heuristic: Nielsen: help users recognise, diagnose, and recover from errors. Scanner: none. Judgement.
- **faceup-error-prevention-destructive**: Irreversible action has no confirm step or undo. A button that deletes data, moves money or makes a legal commitment acts on the first click and cannot be reversed. Add a confirm step or an undo.
  Accessibility failure. WCAG 3.3.4 Error Prevention (Legal, Financial, Data) (Level AA). Scanner: none.
- **faceup-fake-heading-or-list**: Heading or list is only styled text. Text looks like a heading or list because of bold, large type or bullet characters, but the code has no heading or list element. Use real heading and list elements, then style them.
  Accessibility failure. WCAG 1.3.1 Info and Relationships (Level A). Scanner: none.
- **faceup-focus-not-visible**: Keyboard focus outline is missing. The site's styles remove the outline that shows keyboard users where they are and put nothing in its place. Restore a clear outline that appears whenever someone uses the keyboard.
  Accessibility failure. WCAG 2.4.7 Focus Visible (Level AA); WCAG 2.4.13 Focus Appearance (Level AAA); Heuristic: Nielsen: visibility of system status. Scanner: code and browser.
- **faceup-focus-obscured-sticky**: Sticky header hides the focused control. A header pinned to the top of the screen covers the field the keyboard has moved to. Tell the browser to leave a gap the height of the header when it scrolls.
  Accessibility failure. WCAG 2.4.11 Focus Not Obscured (Minimum) (Level AA); WCAG 2.4.12 Focus Not Obscured (Enhanced) (Level AAA); Heuristic: Nielsen: visibility of system status. Scanner: browser.
- **faceup-focus-order-jumps**: Focus jumps around the page. Pressing Tab moves through the page in an order that does not match the layout, or leaves focus behind an open dialog. Write the code in visual order and move focus into dialogs.
  Accessibility failure. WCAG 2.4.3 Focus Order (Level A); Heuristic: Nielsen: consistency and standards. Scanner: none.
- **faceup-generic-button-copy**: Button label does not name the action. The button that charges the card says 'Continue', the same word as every earlier step. Name the action, such as 'Place order'.
  UX failure. Heuristic: Nielsen: match between system and the real world; Heuristic: Nielsen: recognition rather than recall. Scanner: none. Judgement.
- **faceup-heading-order**: Heading levels skip or run out of order. Heading levels are picked for their size, so the page jumps from level 1 to level 3. Choose each heading's level by where it sits in the page, and set its size separately.
  UX failure. Heuristic: W3C WAI Tutorials, Page Structure, Headings: skipping heading ranks can be confusing and should be avoided where possible. Scanner: code and browser.
- **faceup-hover-content-not-dismissible**: Tooltip cannot be dismissed or reached. A tooltip closes the moment the pointer moves, so nobody can reach or dismiss it. Let Escape close it, and keep it open while the pointer is over it.
  Accessibility failure. WCAG 1.4.13 Content on Hover or Focus (Level AA). Scanner: none.
- **faceup-inconsistent-naming**: Same action has a different name on each page. The button that saves changes says 'Save' on one page, 'Update' on the next and 'Submit' on a third. Give each action one name and use it everywhere.
  Accessibility failure. WCAG 3.2.4 Consistent Identification (Level AA); Heuristic: Nielsen: consistency and standards. Scanner: none.
- **faceup-infinite-scroll-no-url-state**: Infinite scroll loses the person's place. A feed that loads more as you scroll forgets your place when you leave or reload. Save the position in the web address so you come back to where you were.
  UX failure. Heuristic: Nielsen: user control and freedom; Heuristic: Nielsen: visibility of system status. Scanner: none.
- **faceup-keyboard-trap**: Keyboard focus gets stuck in a component. A date picker takes over the keyboard and no key gets you out. Let Tab leave it, and make Escape close it and return focus to the button that opened it.
  Accessibility failure. WCAG 2.1.2 No Keyboard Trap (Level A); Heuristic: Nielsen: user control and freedom. Scanner: browser.
- **faceup-label-not-in-name**: Spoken name differs from the visible label. A button shows 'Send', but its hidden name is 'Submit form', so saying 'click Send' to voice control does nothing. Make the name contain the visible words, ideally at the start.
  Accessibility failure. WCAG 2.5.3 Label in Name (Level A). Scanner: none.
- **faceup-lang-missing**: Page language is not set. The page never says what language it is in, so a screen reader may read it in the wrong voice. Add a valid language code, such as en-AU, at the top of the page.
  Accessibility failure. WCAG 3.1.1 Language of Page (Level A). Scanner: browser.
- **faceup-lang-of-parts-missing**: Passage in another language is not marked. A quote, title or passage in another language has no language code, so a screen reader reads it with the page's pronunciation. Add a language code (the lang attribute) to the element that holds it.
  Accessibility failure. WCAG 3.1.2 Language of Parts (Level AA). Scanner: none.
- **faceup-missing-empty-state**: Empty list shows nothing. When a list has no records, the person sees a blank area with no explanation. Say why the list is empty and give one clear next step.
  UX failure. Heuristic: Nielsen: visibility of system status; Heuristic: Nielsen: help users recognise, diagnose, and recover from errors. Scanner: code.
- **faceup-missing-error-branch**: Failed data load shows no error. The page plans only for data loading successfully, so a failure leaves a spinner that never stops or a blank area. Show a specific error and a way to try again.
  UX failure. Heuristic: Nielsen: help users recognise, diagnose, and recover from errors. Scanner: code.
- **faceup-missing-loading-state**: Nothing shows while data loads. While data is on its way, the page shows nothing to say it is loading. Show a clear loading message, and make sure screen readers announce it too.
  UX failure. Heuristic: Nielsen: visibility of system status. Scanner: code.
- **faceup-motion-only-input**: Shaking or tilting is the only way to do something. Undo works only by shaking the phone, with no button and no way to turn shaking off. Add a button for the same action and a setting that switches the motion response off.
  Accessibility failure. WCAG 2.5.4 Motion Actuation (Level A). Scanner: none.
- **faceup-nav-order-changes**: Menu order changes from page to page. The main menu lists the same links on every page, but in a different order on some of them. Build the menu from one shared list so the order stays the same everywhere.
  Accessibility failure. WCAG 3.2.3 Consistent Navigation (Level AA); Heuristic: Nielsen: consistency and standards. Scanner: none.
- **faceup-nontext-contrast**: Controls and icons have low contrast. Field borders, focus outlines and switches are drawn in colours barely different from the background. Keep each at a contrast of 3:1 or more against what sits behind it.
  Accessibility failure. WCAG 1.4.11 Non-text Contrast (Level AA); WCAG 2.4.13 Focus Appearance (Level AAA). Scanner: browser.
- **faceup-orientation-locked**: Page only works upright or sideways. The page hides its content and asks people to rotate their device, or locks itself to one direction. Let the layout work both upright and sideways.
  Accessibility failure. WCAG 1.3.4 Orientation (Level AA). Scanner: none.
- **faceup-page-title-generic**: Page title is the same on every view. Every view in the app keeps the template's placeholder title, so browser tabs and history all look the same. Give every view its own title that describes it.
  Accessibility failure. WCAG 2.4.2 Page Titled (Level A). Scanner: browser.
- **faceup-paste-blocked-password**: Password field blocks paste. The login form stops people pasting into the password and email fields, which breaks password managers. Remove the code that blocks pasting.
  Accessibility failure. WCAG 3.3.8 Accessible Authentication (Minimum) (Level AA); Heuristic: Nielsen: error prevention. Scanner: none.
- **faceup-placeholder-as-label**: Placeholder text is the only label. The grey hint text inside a field is its only label, and it disappears once typing starts. Give each field a label that stays visible.
  Accessibility failure. WCAG 3.3.2 Labels or Instructions (Level A); WCAG 1.4.3 Contrast (Minimum) (Level AA); Heuristic: Nielsen: recognition rather than recall. Scanner: browser.
- **faceup-pointer-gesture-no-alternative**: Gesture with no single-tap alternative. A carousel only moves when you swipe, with no buttons to tap. Keep the swipe and add next and previous buttons that do the same job with one tap.
  Accessibility failure. WCAG 2.5.1 Pointer Gestures (Level A). Scanner: none.
- **faceup-premature-validation**: Field shows an error before typing is finished. An email field turns red at the first letter, long before the person has finished typing. Wait until they leave the field before checking it.
  UX failure. Heuristic: Nielsen: error prevention; Heuristic: Luke Wroblewski, Inline Validation in Web Forms (A List Apart, 2009): check a field after the person leaves it, not while they type. Scanner: none.
- **faceup-progress-not-shown-multistep**: Multi-step form does not show progress. Each step of a sign-up shows a heading and a Next button but gives no sign of how many steps there are. Show the current step and the total on every step.
  UX failure. Heuristic: Nielsen: visibility of system status. Scanner: none.
- **faceup-reduced-motion-ignored**: Animation ignores the reduce-motion setting. Parallax, lifting cards and scroll fades play for everyone, including people who have asked their device for less motion. Add styles that stop or reduce movement when that setting is on.
  UX failure. WCAG 2.3.3 Animation from Interactions (Level AAA). Scanner: code and browser.
- **faceup-redundant-entry-multistep**: Form asks for information already given. A checkout asks for the delivery address, then asks for the same details again as the billing address. Carry the earlier answer forward and let the person change it.
  Accessibility failure. WCAG 3.3.7 Redundant Entry (Level A); Heuristic: Nielsen: recognition rather than recall. Scanner: none.
- **faceup-reflow-horizontal-scroll**: Content breaks when zoomed or on a narrow screen. A fixed-width layout and text sized to the window break when the person zooms in or uses a narrow screen. Let sections shrink to fit, and size text in units that grow with zoom.
  Accessibility failure. WCAG 1.4.10 Reflow (Level AA); WCAG 1.4.4 Resize Text (Level AA). Scanner: browser.
- **faceup-sensory-instructions**: Instructions rely on colour, shape or position. Instructions point to things only by how they look or where they sit, such as 'press the green button'. Name each thing by its visible label as well.
  Accessibility failure. WCAG 1.3.3 Sensory Characteristics (Level A); WCAG 1.4.1 Use of Colour (Level A). Scanner: none.
- **faceup-single-key-shortcut**: Single-key shortcut fires while typing. Pressing a single key, such as '/' or 'j', triggers a shortcut anywhere on the page. Require Ctrl, Alt or Cmd, let people turn shortcuts off, or limit each to its own focused component.
  Accessibility failure. WCAG 2.1.4 Character Key Shortcuts (Level A); Heuristic: Nielsen: user control and freedom. Scanner: none.
- **faceup-single-way-to-page**: Only one way to reach a page. Some pages can only be reached through the menu, with no search, site map or related links. Give every page at least two ways in.
  Accessibility failure. WCAG 2.4.5 Multiple Ways (Level AA); Heuristic: Nielsen: flexibility and efficiency of use. Scanner: none.
- **faceup-skip-link-missing**: No way to skip past the menu. Every page starts with a long menu that keyboard users cannot jump past. Add a skip link that jumps to the main content, and wrap that content in a main element.
  Accessibility failure. WCAG 2.4.1 Bypass Blocks (Level A); Heuristic: Nielsen: flexibility and efficiency of use. Scanner: none.
- **faceup-target-too-small**: Tap targets are too small. An icon button is about 16 by 16 pixels and easy to miss. Keep the icon size and make the button at least 24 by 24 pixels, or 44 for touch.
  Accessibility failure. WCAG 2.5.8 Target Size (Minimum) (Level AA). Scanner: browser.
- **faceup-text-spacing-clipped**: Text is cut off when spacing is increased. Text boxes that hide anything past a fixed height or line count cut off text when someone widens text spacing. Let boxes grow with their text, and do not lock spacing with !important.
  Accessibility failure. WCAG 1.4.12 Text Spacing (Level AA). Scanner: none.
- **faceup-timeout-no-warning**: Session times out with no warning. The session signs the person out after a set time, discarding their answers without warning. Warn them first and let them extend it with one action.
  Accessibility failure. WCAG 2.2.1 Timing Adjustable (Level A); Heuristic: Nielsen: error prevention. Scanner: none.
- **faceup-toast-only-error**: Error appears only in a pop-up that is not announced. A save error appears in a small corner pop-up that screen readers do not announce. Put the message in an announcement area that stays on the page.
  Accessibility failure. WCAG 4.1.3 Status Messages (Level AA). Scanner: none.
- **faceup-vague-heading-or-label**: Heading or label says nothing about what follows. Headings such as 'Details' or 'Section 1' and labels such as 'Value' do not say what each part is for. Name each section's topic and each field's purpose.
  Accessibility failure. WCAG 2.4.6 Headings and Labels (Level AA); Heuristic: Nielsen: match between system and the real world; Heuristic: Nielsen: recognition rather than recall. Scanner: none. Judgement.
- **faceup-vague-link-text**: Link text does not say where it goes. Links say 'Click here' or 'Read more', which never names the destination. Put the destination in the link words.
  Accessibility failure. WCAG 2.4.4 Link Purpose (In Context) (Level A); Heuristic: Nielsen: recognition rather than recall. Scanner: code.
- **faceup-visual-order-differs**: Layout puts content in a different reading order. CSS rearranges content on screen while screen readers follow the code, so they read it in an order that changes the meaning. Write the code in reading order and let the layout follow.
  Accessibility failure. WCAG 1.3.2 Meaningful Sequence (Level A). Scanner: none.
