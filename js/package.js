/**
 * Mengisi dropdown select dengan opsi Paket 1 sampai Paket 100 secara otomatis
 */
export function initPackageDropdown() {
    const packageSelect = document.getElementById("package-selection");
    if (packageSelect) {
        // Hapus opsi lama jika ada (kecuali opsi default/disabled)
        const defaultOption = packageSelect.querySelector('option[disabled]');
        packageSelect.innerHTML = '';
        if (defaultOption) {
            packageSelect.appendChild(defaultOption);
        }

        // Generate Paket 1 - 100
        for (let i = 1; i <= 100; i++) {
            const option = document.createElement("option");
            option.value = i;
            option.textContent = `Paket ${i}`;
            packageSelect.appendChild(option);
        }
    }
}
