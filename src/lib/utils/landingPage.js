import { annotate } from "rough-notation";
// import { writable, get } from "svelte/store";
export let titleTagVisibility = true;
export function annotateAction(node, config) {
    function applyConfig(target, c) {
        for (let key in c) {
            if (
                key !== "visible" &&
                (!c.hasOwnProperty || c.hasOwnProperty(key))
            ) {
                let value = c[key];
                if (target[key] !== value) {
                    target[key] = value;
                }
            }
        }
    }

    function updateVisible(visible) {
        if (visible) {
            annotation.show();
        } else {
            annotation.hide();
        }
    }

    let annotateConfig = {};
    applyConfig(annotateConfig, config);
    let annotation = annotate(node, annotateConfig);

    //  click to cancel

    updateVisible(config.visible);
    // updateVisible(titleTagVisibility)
    
    // function handTitleTagClick(event) {
    //     if (titleTagVisibility) {
    //         titleTagVisibility = !titleTagVisibility;
    //     } else {
    //         titleTagVisibility = node.textContent == event.target.textContent;
    //     }
    //     updateVisible(titleTagVisibility);
    // }

    // node.addEventListener("click", handTitleTagClick);
    return {
        update(newConfig) {
            applyConfig(annotation, newConfig);
            updateVisible(newConfig.visible);
        },
        destroy() {
            annotation.remove();
        },
    };
}

