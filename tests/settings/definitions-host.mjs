const changes = [];

export function installHostDom(document) {
  Object.defineProperties(document.defaultView.HTMLElement.prototype, {
    empty: {
      configurable: true,
      value: function () {
        this.replaceChildren();
      },
    },
    setText: {
      configurable: true,
      value: function (text) {
        this.textContent = text;
      },
    },
    createEl: {
      configurable: true,
      value: function (tag, options = {}) {
        const element = this.ownerDocument.createElement(tag);
        element.className = options.cls ?? "";
        element.textContent = options.text ?? "";
        this.append(element);
        return element;
      },
    },
  });
}

// Only the existing native row/dropdown contract is adapted; the browser owns the DOM.
export class PluginSettingTab {
  constructor(app) {
    this.containerEl = app.containerEl;
  }

  hide() {}
}

export class Setting {
  constructor(container) {
    this.settingEl = container.createEl("div", { cls: "setting-item" });
    this.infoEl = this.settingEl.createEl("div", { cls: "setting-item-info" });
    this.nameEl = this.infoEl.createEl("div", { cls: "setting-item-name" });
    this.descEl = this.infoEl.createEl("div", { cls: "setting-item-description" });
    this.controlEl = this.settingEl.createEl("div", { cls: "setting-item-control" });
  }

  setName(name) {
    this.nameEl.textContent = name;
    return this;
  }

  setDesc(description) {
    this.descEl.textContent = description;
    return this;
  }

  addDropdown(render) {
    const selectEl = this.controlEl.createEl("select");
    const dropdown = {
      selectEl,
      addOption(value, label) {
        const option = selectEl.createEl("option", { text: label });
        option.value = value;
        return dropdown;
      },
      setValue(value) {
        selectEl.value = value;
        return dropdown;
      },
      onChange(callback) {
        selectEl.addEventListener("change", () => {
          changes.push(Promise.resolve(callback(selectEl.value)));
        });
        return dropdown;
      },
    };
    render(dropdown);
    return this;
  }
}

export async function settleChanges() {
  await Promise.all(changes.splice(0));
}

export function snapshot(container) {
  return {
    controls: [...container.querySelectorAll("select")].map((select) => ({
      name: select.getAttribute("aria-label"),
      value: select.value,
      options: [...select.options].map((option) => [option.value, option.textContent]),
    })),
    summary: container.querySelector(".marginote-settings-summary")?.textContent,
    live: container.querySelector(".marginote-settings-summary")?.getAttribute("aria-live"),
  };
}
