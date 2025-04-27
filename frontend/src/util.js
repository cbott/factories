// Frontend helper utilities

/**
 * Retrieves the image path for a given tool.
 *
 * @param {string} tool - The name of the tool. Supported values are 'hammer', 'wrench', 'gear', and 'shovel'.
 * @returns {string} The relative path to the tool's image. Returns an empty string if the tool is not recognized.
 */
export function getToolImage(tool) {
  switch (tool) {
    case 'hammer':
      return '/hammer.png'
    case 'wrench':
      return '/wrench.png'
    case 'gear':
      return '/gear.png'
    case 'shovel':
      return '/shovel.png'
    default:
      return ''
  }
}
