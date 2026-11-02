import { copyDiagnosticPanel } from "./diagnosticsView.js";

function configureTabList({ buttons, panels, panelIdForButton, label }) {
  if (!buttons.length) return;

  const group = buttons[0].parentElement;
  group?.setAttribute("role", "tablist");
  group?.setAttribute("aria-label", label);
  group?.setAttribute("aria-orientation", "horizontal");

  const panelFor = (button) => panels.find((panel) => panel.id === panelIdForButton(button));

  function activate(selectedButton, moveFocus = false) {
    buttons.forEach((button) => {
      const panel = panelFor(button);
      if (!panel) return;

      const selected = button === selectedButton;
      button.classList.toggle("active", selected);
      button.setAttribute("role", "tab");
      button.setAttribute("aria-controls", panel.id);
      button.setAttribute("aria-selected", String(selected));
      button.tabIndex = selected ? 0 : -1;

      panel.setAttribute("role", "tabpanel");
      panel.setAttribute("aria-labelledby", button.id);
      panel.tabIndex = 0;
      panel.hidden = !selected;
    });

    if (moveFocus) selectedButton.focus();
  }

  buttons.forEach((button, index) => {
    const panel = panelFor(button);
    if (!panel) return;

    if (!button.id) button.id = panel.id + "-tab";
    button.setAttribute("role", "tab");
    button.setAttribute("aria-controls", panel.id);
    panel.setAttribute("role", "tabpanel");
    panel.setAttribute("aria-labelledby", button.id);
    panel.tabIndex = 0;

    button.addEventListener("click", () => activate(button));
    button.addEventListener("keydown", (event) => {
      const isRtl = Boolean(group?.closest?.('[dir="rtl"]')) || document.documentElement.dir === "rtl";
      const forwardKey = isRtl ? "ArrowLeft" : "ArrowRight";
      const backwardKey = isRtl ? "ArrowRight" : "ArrowLeft";
      let nextIndex = -1;

      if (event.key === forwardKey) nextIndex = (index + 1) % buttons.length;
      else if (event.key === backwardKey) nextIndex = (index - 1 + buttons.length) % buttons.length;
      else if (event.key === "Home") nextIndex = 0;
      else if (event.key === "End") nextIndex = buttons.length - 1;

      if (nextIndex < 0) return;
      event.preventDefault();
      activate(buttons[nextIndex], true);
    });
  });

  const initial = buttons.find((button) => button.classList.contains("active")) ?? buttons[0];
  activate(initial);
}

export function setupTabs(elements) {
  configureTabList({
    buttons: elements.panelTabButtons,
    panels: [elements.dictionaryRootPanel, elements.diagnosticRootPanel],
    panelIdForButton: (button) => button.dataset.panelRoot,
    label: "Reference workspaces"
  });

  configureTabList({
    buttons: elements.dictionaryTabButtons,
    panels: [
      elements.sampleSpellReferencePanel,
      elements.sigilReferencePanel,
      elements.signReferencePanel
    ],
    panelIdForButton: (button) => button.dataset.dictionaryPanel,
    label: "Dictionary entries"
  });

  configureTabList({
    buttons: elements.diagnosticTabButtons,
    panels: [elements.parserPanelShell, elements.astPanelShell, elements.irPanelShell],
    panelIdForButton: (button) => button.dataset.diagnosticPanel + "Shell",
    label: "Diagnostic views"
  });

  elements.diagnosticCopyButtons.forEach((button) => {
    button.addEventListener("click", () => {
      copyDiagnosticPanel(button.dataset.copyPanel, button);
    });
  });
}
