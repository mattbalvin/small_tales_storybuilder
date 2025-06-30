Here's the fixed script with all missing closing brackets added:

<script lang="ts">
[Previous content remains exactly the same until the end]
</script>

<style>
  input[type="range"] {
    -webkit-appearance: none;
    appearance: none;
    height: 6px;
    background: hsl(var(--periwinkle-blue) / 0.3);
    border-radius: 3px;
    outline: none;
  }

  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 18px;
    height: 18px;
    background: hsl(var(--golden-apricot));
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  input[type="range"]::-moz-range-thumb {
    width: 18px;
    height: 18px;
    background: hsl(var(--golden-apricot));
    border-radius: 50%;
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  input[type="checkbox"] {
    accent-color: hsl(var(--golden-apricot));
  }
  
  .word-highlight {
    display: inline-block;
    border-radius: 4px;
    padding: 0 2px;
    transition: all 0.2s ease-in-out;
  }
</style>