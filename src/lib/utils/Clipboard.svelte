<script>
  import { onMount, reactive } from 'svelte';
  import Icon from 'components/_ui/Icon/Icon.svelte';
  import ConfirmationFade from 'components/_ui/ConfirmationFade/ConfirmationFade.svelte';
  let className;
  let text;
  let props;
  let canCopy = false;
  let hasCopied = false;

  onMount(async () => {
      try {
          const copySupport = await navigator.permissions.query({name: "clipboard-write"})
          canCopy = copySupport.state === "granted"
      } catch(e) {
          canCopy = false
      }
  });

  const onCopy = () => {
      if (!navigator.clipboard || !navigator.clipboard.writeText) return;
      navigator.clipboard.writeText(text);
      hasCopied = true;
  }

  $: if (!canCopy) return null;
</script>

<div class={`ClipboardTrigger ${className}`} {...props} on:click={onCopy}>
  {#if hasCopied}
      <ConfirmationFade on:faded={() => (hasCopied = false)}>
          Copied to clipboard!
      </ConfirmationFade>
  {/if}
  <Icon className="ClipboardTrigger__icon" name="copy" />
  <slot></slot>
</div>
