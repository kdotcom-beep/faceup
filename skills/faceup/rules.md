# Face Up rules

Each rule's severity, anchors, what the scanner checks, and "Judgement" when a person must decide. "Scanner: none" means the scanner does not check the rule, so its silence means nothing. Read the rule's file in `catalogue/` before checking it.

- **faceup-action-on-focus**: Moving focus onto a control triggers an action. Moving keyboard focus onto a control must not submit a form, open a window or load a page. Otherwise keyboard and screen reader users passing through are sent somewhere they did not choose.
  Accessibility failure. WCAG 3.2.1 On Focus (Level A); Heuristic: Nielsen: user control and freedom. Scanner: none.
- **faceup-action-on-press**: Action fires on press, before release. A control should act when the pointer is released, not when it is pressed. Acting on release lets people with tremors or low vision cancel a mistaken press by sliding off before letting go.
  Accessibility failure. WCAG 2.5.2 Pointer Cancellation (Level A). Scanner: none.
- **faceup-aria-references-missing-id**: Label or description points to an element that is not there. When a control takes its name or hint from another element, that element must exist on the page. If it does not, screen readers announce only 'button' and skip the hint entirely.
  Accessibility failure. WCAG 4.1.2 Name, Role, Value (Level A). Scanner: browser.
- **faceup-async-status-not-announced**: Loading and saving status is not announced. Status changes such as 'Saving' and 'Saved' must be announced to screen readers, not only shown on screen. Without the announcement, screen reader users cannot tell whether their action worked.
  Accessibility failure. WCAG 4.1.3 Status Messages (Level AA). Scanner: none.
- **faceup-autocomplete-missing**: Personal details fields have no autocomplete. Fields for personal details should tell the browser what they hold, such as name, email or card number. This lets browsers fill them in, sparing people with motor or memory difficulties from typing details again.
  Accessibility failure. WCAG 1.3.5 Identify Input Purpose (Level AA); Heuristic: Nielsen: recognition rather than recall. Scanner: none.
- **faceup-autofocus-misused**: Page moves focus to a field on load. A page should not move keyboard focus to a field when it loads. The jump makes screen reader and magnifier users lose their place and skips keyboard users past the heading and navigation.
  UX failure. Heuristic: Nielsen: user control and freedom. Scanner: none.
- **faceup-autoplay-media-no-control**: Audio or video plays on load with no controls. Audio or video must not play on load unless people can pause or stop it. Sound that starts by itself drowns out screen readers, and people in quiet places cannot silence it.
  Accessibility failure. WCAG 1.4.2 Audio Control (Level A); WCAG 2.2.2 Pause, Stop, Hide (Level A); Heuristic: Nielsen: user control and freedom. Scanner: browser.
- **faceup-back-discards-data**: Going back clears what the person entered. Going back a step in a form should keep everything the person has already entered. Losing it forces them to retype finished work, which costs switch and voice control users every character twice.
  Accessibility failure. WCAG 3.3.7 Redundant Entry (Level A); Heuristic: Nielsen: user control and freedom. Scanner: none.
- **faceup-cognitive-auth-test**: Login depends on memory or a puzzle. Logging in must not depend on remembering, transcribing or solving something without help such as pasting or a password manager. Memory tests lock out people with memory difficulties, dyslexia or difficulty with numbers.
  Accessibility failure. WCAG 3.3.8 Accessible Authentication (Minimum) (Level AA); Heuristic: Nielsen: recognition rather than recall. Scanner: none.
- **faceup-colour-only-signal**: Colour alone marks an error or a link. Colour must not be the only way to show an error, a link or a state. Colour-blind people may not see the difference, so they miss the error or cannot find the link.
  Accessibility failure. WCAG 1.4.1 Use of Colour (Level A); WCAG 3.3.1 Error Identification (Level A); Heuristic: Nielsen: visibility of system status. Scanner: none.
- **faceup-consistent-help**: Help is in a different place on each page. Help links and contact details should sit in the same place on every page. People who found help once look for it there again, and people with cognitive disabilities rely on that consistency.
  Accessibility failure. WCAG 3.2.6 Consistent Help (Level A); Heuristic: Nielsen: consistency and standards. Scanner: none.
- **faceup-context-change-on-input**: Changing a field opens a new page. Changing a field's value must not load a new page or make another major change without warning. Keyboard users browsing a list with the arrow keys can be sent away before they have chosen.
  Accessibility failure. WCAG 3.2.2 On Input (Level A). Scanner: none.
- **faceup-control-missing-name**: Button or link has no name. Every button and link needs a name that screen readers can read out. Without one, screen reader users hear only 'button' or 'link', and voice control users have nothing to say to press it.
  Accessibility failure. WCAG 4.1.2 Name, Role, Value (Level A); WCAG 2.4.4 Link Purpose (In Context) (Level A). Scanner: code and browser.
- **faceup-destructive-no-undo**: Delete cannot be undone. Deleting something should come with a way to get it back, such as undo or a bin. Without one, a single slip loses the item, which falls hardest on people with motor or cognitive disabilities.
  UX failure. Heuristic: Nielsen: user control and freedom; Heuristic: Nielsen: error prevention. Scanner: none. Judgement.
- **faceup-disabled-submit-no-reason**: Disabled submit button gives no reason. A submit button should not be disabled without saying what still needs doing. People are left hunting for the problem, keyboard users cannot reach the button, and some give up.
  UX failure. Heuristic: Nielsen: help users recognise, diagnose, and recover from errors; Heuristic: Nielsen: visibility of system status. Scanner: none.
- **faceup-div-as-button**: Clickable element that is not a button. Anything that acts like a button should be a real button element. A clickable box cannot be reached with the keyboard, is not announced as a button, and cannot be pressed by voice command.
  Accessibility failure. WCAG 4.1.2 Name, Role, Value (Level A); WCAG 2.1.1 Keyboard (Level A). Scanner: code.
- **faceup-dragging-no-alternative**: Reordering only works by dragging. Anything that can be done by dragging must also work with single clicks or taps. People with tremors, or who point with their head or eyes, cannot hold a steady drag.
  Accessibility failure. WCAG 2.5.7 Dragging Movements (Level AA). Scanner: none.
- **faceup-error-not-identified**: Error message is vague and not linked to its field. An error message should be linked to its field and say how to fix the problem. Otherwise screen reader users do not hear it at the field, and nobody learns what to change.
  Accessibility failure. WCAG 3.3.3 Error Suggestion (Level AA); Heuristic: Nielsen: help users recognise, diagnose, and recover from errors. Scanner: none. Judgement.
- **faceup-error-prevention-destructive**: Irreversible action has no confirm step or undo. Actions that delete data, take payment or make a legal commitment need a confirm step or an undo. Without one, a single slip from a tremor or a misread label cannot be reversed.
  Accessibility failure. WCAG 3.3.4 Error Prevention (Legal, Financial, Data) (Level AA). Scanner: none.
- **faceup-fake-heading-or-list**: Heading or list is only styled text. Headings and lists must be real heading and list elements, not text styled to look like them. Screen reader users jump by headings and count list items, so styled text hides the structure.
  Accessibility failure. WCAG 1.3.1 Info and Relationships (Level A). Scanner: none.
- **faceup-focus-not-visible**: Keyboard focus outline is missing. Whatever has keyboard focus must show a visible outline. Without it, keyboard and switch users cannot tell where they are or what pressing Enter will do.
  Accessibility failure. WCAG 2.4.7 Focus Visible (Level AA); WCAG 2.4.13 Focus Appearance (Level AAA); Heuristic: Nielsen: visibility of system status. Scanner: code and browser.
- **faceup-focus-obscured-sticky**: Sticky header hides the focused control. A sticky header or footer must not cover the control that has keyboard focus. When it does, keyboard users and people with low vision lose their place and type into a hidden field.
  Accessibility failure. WCAG 2.4.11 Focus Not Obscured (Minimum) (Level AA); WCAG 2.4.12 Focus Not Obscured (Enhanced) (Level AAA); Heuristic: Nielsen: visibility of system status. Scanner: code and browser.
- **faceup-focus-order-jumps**: Focus jumps around the page. Pressing Tab should move through the page in the same order people read it. When focus jumps around or skips an open dialog, keyboard users miss fields and lose their place.
  Accessibility failure. WCAG 2.4.3 Focus Order (Level A); Heuristic: Nielsen: consistency and standards. Scanner: none.
- **faceup-generic-button-copy**: Button label does not name the action. A button should name what it does, such as 'Place order', not just 'Continue' or 'Submit'. People need to know before pressing whether they are about to be charged or commit to something.
  UX failure. Heuristic: Nielsen: match between system and the real world; Heuristic: Nielsen: recognition rather than recall. Scanner: none. Judgement.
- **faceup-heading-order**: Heading levels skip or run out of order. Heading levels should step down one at a time to match the page's structure. Screen reader users treat headings as a map, so a skipped level suggests a missing section.
  UX failure. Heuristic: W3C WAI Tutorials, Page Structure, Headings: skipping heading ranks can be confusing and should be avoided where possible. Scanner: code and browser.
- **faceup-hover-content-not-dismissible**: Tooltip cannot be dismissed or reached. Tooltips must stay open while the pointer is over them and close when Escape is pressed. Otherwise some people cannot read them and others cannot get them out of the way.
  Accessibility failure. WCAG 1.4.13 Content on Hover or Focus (Level AA). Scanner: none.
- **faceup-inconsistent-naming**: Same action has a different name on each page. An action that repeats across pages should keep the same name. People with memory or cognitive disabilities read a new word as a new action, and voice control users cannot find it.
  Accessibility failure. WCAG 3.2.4 Consistent Identification (Level AA); Heuristic: Nielsen: consistency and standards. Scanner: none.
- **faceup-infinite-scroll-no-url-state**: Infinite scroll loses the person's place. A feed that loads more as people scroll should remember their place when they leave and return. Otherwise keyboard and switch users, and people on slow connections, must scroll all the way back down.
  UX failure. Heuristic: Nielsen: user control and freedom; Heuristic: Nielsen: visibility of system status. Scanner: none.
- **faceup-keyboard-trap**: Keyboard focus gets stuck in a component. Keyboard focus must be able to leave every component it can enter. A trap cuts keyboard users off from the rest of the page, forcing a reload that loses whatever they typed.
  Accessibility failure. WCAG 2.1.2 No Keyboard Trap (Level A); Heuristic: Nielsen: user control and freedom. Scanner: browser.
- **faceup-label-not-in-name**: Spoken name differs from the visible label. A control's spoken name must contain the words shown on it. Voice control users say what they see, so a button labelled 'Send' but named 'Submit form' does not respond.
  Accessibility failure. WCAG 2.5.3 Label in Name (Level A). Scanner: browser.
- **faceup-lang-missing**: Page language is not set. Every page must declare the language it is written in. Without it, screen readers guess, often wrongly, and read every word with the wrong pronunciation.
  Accessibility failure. WCAG 3.1.1 Language of Page (Level A). Scanner: browser.
- **faceup-lang-of-parts-missing**: Passage in another language is not marked. Passages in a different language from the rest of the page must be marked with their language. Otherwise screen readers mispronounce them, and translation tools treat them as the page's language.
  Accessibility failure. WCAG 3.1.2 Language of Parts (Level AA). Scanner: none.
- **faceup-missing-empty-state**: Empty list shows nothing. A list with nothing in it should say why it is empty and what to do next. A blank area looks the same whether there is nothing yet, nothing matched or the app is broken.
  UX failure. Heuristic: Nielsen: visibility of system status; Heuristic: Nielsen: help users recognise, diagnose, and recover from errors. Scanner: code.
- **faceup-missing-error-branch**: Failed data load shows no error. When data fails to load, the page should show a clear error and a way to try again. Otherwise people wait on a spinner that never stops, or see a blank area with no explanation.
  UX failure. Heuristic: Nielsen: help users recognise, diagnose, and recover from errors. Scanner: code.
- **faceup-missing-loading-state**: Nothing shows while data loads. While data loads, the page should show that it is loading, to sighted and screen reader users alike. Otherwise people cannot tell if anything is happening, so they tap again, reload or leave.
  UX failure. Heuristic: Nielsen: visibility of system status. Scanner: code.
- **faceup-motion-only-input**: Shaking or tilting is the only way to do something. Actions triggered by shaking or tilting need a button alternative and a way to turn motion off. People with a mounted phone cannot shake it, and people with tremors trigger it by accident.
  Accessibility failure. WCAG 2.5.4 Motion Actuation (Level A). Scanner: none.
- **faceup-nav-order-changes**: Menu order changes from page to page. Menus that repeat across pages must keep their links in the same order. People learn where links sit, so keyboard users who count Tab presses land on the wrong one when the order changes.
  Accessibility failure. WCAG 3.2.3 Consistent Navigation (Level AA); Heuristic: Nielsen: consistency and standards. Scanner: none.
- **faceup-nontext-contrast**: Controls and icons have low contrast. Field borders, focus outlines, icons and switches need a contrast of at least 3:1 against what is around them. Below that, people with low vision or a screen in bright light cannot see them.
  Accessibility failure. WCAG 1.4.11 Non-text Contrast (Level AA); WCAG 2.4.13 Focus Appearance (Level AAA). Scanner: browser.
- **faceup-orientation-locked**: Page only works upright or sideways. A page must work whether the device is held upright or sideways. People with a mounted device cannot turn it, and some people with low vision turn theirs sideways for larger text.
  Accessibility failure. WCAG 1.3.4 Orientation (Level AA). Scanner: none.
- **faceup-page-title-generic**: Page title is the same on every view. Every page or view needs its own title describing what it is. Screen reader users hear the title first, and people with many tabs open use it to tell pages apart.
  Accessibility failure. WCAG 2.4.2 Page Titled (Level A). Scanner: browser.
- **faceup-paste-blocked-password**: Password field blocks paste. Password fields must allow pasting, so password managers can fill them. Blocking paste forces people with motor impairments to type long passwords by hand and people with memory difficulties to remember them.
  Accessibility failure. WCAG 3.3.8 Accessible Authentication (Minimum) (Level AA); Heuristic: Nielsen: error prevention. Scanner: none.
- **faceup-placeholder-as-label**: Placeholder text is the only label. Every field needs a label that stays visible, not just grey hint text inside it. The hint vanishes once typing starts, leaving people unsure what the field was for.
  Accessibility failure. WCAG 3.3.2 Labels or Instructions (Level A); WCAG 1.4.3 Contrast (Minimum) (Level AA); Heuristic: Nielsen: recognition rather than recall. Scanner: browser.
- **faceup-pointer-gesture-no-alternative**: Gesture with no single-tap alternative. Anything done with a swipe, pinch or other gesture must also work with a single tap or click. Switch users and people with limited hand control cannot perform gestures reliably.
  Accessibility failure. WCAG 2.5.1 Pointer Gestures (Level A). Scanner: none.
- **faceup-premature-validation**: Field shows an error before typing is finished. A field should not be checked until the person has finished with it. Errors shown while typing tell people they are wrong when they are not, and screen readers may announce them at every keystroke.
  UX failure. Heuristic: Nielsen: error prevention; Heuristic: Luke Wroblewski, Inline Validation in Web Forms (A List Apart, 2009): check a field after the person leaves it, not while they type. Scanner: none.
- **faceup-progress-not-shown-multistep**: Multi-step form does not show progress. A form split into steps should show which step the person is on and how many there are. Without it, people cannot judge how long is left, and some give up.
  UX failure. Heuristic: Nielsen: visibility of system status. Scanner: none.
- **faceup-reduced-motion-ignored**: Animation ignores the reduce-motion setting. Animations should stop or reduce when a person's device is set to reduce motion. Large movement can cause nausea, dizziness or migraines for people with vestibular (balance) disorders.
  UX failure. WCAG 2.3.3 Animation from Interactions (Level AAA). Scanner: code and browser.
- **faceup-redundant-entry-multistep**: Form asks for information already given. A form should not ask for information the person has already given. Entering it twice costs people with motor impairments real effort and makes people with memory difficulties recall it again.
  Accessibility failure. WCAG 3.3.7 Redundant Entry (Level A); Heuristic: Nielsen: recognition rather than recall. Scanner: none.
- **faceup-reflow-horizontal-scroll**: Content breaks when zoomed or on a narrow screen. Content must fit a narrow screen or zoomed page without sideways scrolling, and text must grow with zoom. Otherwise people who zoom in or use small phones must scroll back and forth on every line.
  Accessibility failure. WCAG 1.4.10 Reflow (Level AA); WCAG 1.4.4 Resize Text (Level AA). Scanner: browser.
- **faceup-sensory-instructions**: Instructions rely on colour, shape or position. Instructions must name things by their label, not only by colour, shape or position, such as 'the green button'. Screen reader users cannot see these cues, and layouts often move things on smaller screens.
  Accessibility failure. WCAG 1.3.3 Sensory Characteristics (Level A); WCAG 1.4.1 Use of Colour (Level A). Scanner: none.
- **faceup-single-key-shortcut**: Single-key shortcut fires while typing. Shortcuts that use a single key, such as 'j' or '/', must be possible to turn off or change. Speech input users and people with tremors set them off by accident.
  Accessibility failure. WCAG 2.1.4 Character Key Shortcuts (Level A); Heuristic: Nielsen: user control and freedom. Scanner: none.
- **faceup-single-way-to-page**: Only one way to reach a page. Every page must be reachable in at least two ways, such as a menu and a search or site map. Deep menus are hard for people with cognitive disabilities and slow for screen reader users.
  Accessibility failure. WCAG 2.4.5 Multiple Ways (Level AA); Heuristic: Nielsen: flexibility and efficiency of use. Scanner: none.
- **faceup-skip-link-missing**: No way to skip past the menu. Pages must let keyboard users skip past repeated menus straight to the main content. Without a skip link or landmarks, they must step through every menu link on every page.
  Accessibility failure. WCAG 2.4.1 Bypass Blocks (Level A); Heuristic: Nielsen: flexibility and efficiency of use. Scanner: browser.
- **faceup-target-too-small**: Tap targets are too small. Buttons and links must be at least 24 by 24 pixels, or have enough space around them. Smaller targets make people with tremors, large fingers or a moving phone hit the wrong control.
  Accessibility failure. WCAG 2.5.8 Target Size (Minimum) (Level AA). Scanner: browser.
- **faceup-text-spacing-clipped**: Text is cut off when spacing is increased. Text must stay fully readable when people increase line, letter, word or paragraph spacing. People with dyslexia or low vision often widen spacing, and fixed-height boxes then cut their text off.
  Accessibility failure. WCAG 1.4.12 Text Spacing (Level AA). Scanner: browser.
- **faceup-timeout-no-warning**: Session times out with no warning. A session that times out must warn people first and let them extend it with one action. Screen reader users, slow readers and anyone fetching a document can otherwise lose everything they entered.
  Accessibility failure. WCAG 2.2.1 Timing Adjustable (Level A); Heuristic: Nielsen: error prevention. Scanner: none.
- **faceup-toast-only-error**: Error appears only in a pop-up that is not announced. Error messages must be announced to screen readers and stay on screen long enough to read. A pop-up that vanishes unannounced leaves screen reader users assuming the action worked, and their work is lost.
  Accessibility failure. WCAG 4.1.3 Status Messages (Level AA). Scanner: none.
- **faceup-vague-heading-or-label**: Heading or label says nothing about what follows. Headings and labels must describe their topic or purpose. Words such as 'Details' or 'Value' tell screen reader users, who often hear them out of context, nothing about what follows.
  Accessibility failure. WCAG 2.4.6 Headings and Labels (Level AA); Heuristic: Nielsen: match between system and the real world; Heuristic: Nielsen: recognition rather than recall. Scanner: none. Judgement.
- **faceup-vague-link-text**: Link text does not say where it goes. Link text must say where the link goes, not just 'click here' or 'read more'. Screen reader users often hear links listed out of context, where vague links all sound the same.
  Accessibility failure. WCAG 2.4.4 Link Purpose (In Context) (Level A); Heuristic: Nielsen: recognition rather than recall. Scanner: code.
- **faceup-visual-order-differs**: Layout puts content in a different reading order. Content must appear in the code in the same order it is meant to be read. Screen readers and keyboards follow the code, so a rearranged layout can read the answer before the question.
  Accessibility failure. WCAG 1.3.2 Meaningful Sequence (Level A). Scanner: none.
