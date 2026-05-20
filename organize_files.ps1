$ErrorActionPreference = "Stop"

# Define directories
$dirs = @(
    "Dashboard_Damage_B2B",
    "Huong_Dan_Chat_Xep",
    "Org_Chart_JD",
    "Network_Mapping_GXT_KTC",
    "Kho_B2B_Optimization",
    "AI_Agents",
    "Docs"
)

# Create directories if they don't exist
foreach ($dir in $dirs) {
    if (-not (Test-Path -Path $dir)) {
        New-Item -ItemType Directory -Path $dir | Out-Null
        Write-Host "Created directory: $dir"
    }
}

# Move Dashboard files
$dashboardFiles = @("B2B Damage Analysis Dashboard.html", "B2B Damage Analysis Dashboard_files", "dashboard.html", "dashboard.css", "dashboard.js")
foreach ($file in $dashboardFiles) {
    if (Test-Path -Path $file) {
        Move-Item -Path $file -Destination "Dashboard_Damage_B2B\" -Force
        Write-Host "Moved $file to Dashboard_Damage_B2B"
    }
}

# Move Huong_Dan_Chat_Xep files
$chatXepFiles = @("chất xếp", "chất xếp.html", "huong_dan_chat_xep.html", "hinh1.png.jpg", "hinh2.png.jpg", "hinh3.png.jpg", "hinh4.png.jpg", "hinh5.png.jpg", "hinh6.png.jpg", "copy_images.bat")
foreach ($file in $chatXepFiles) {
    if (Test-Path -Path $file) {
        Move-Item -Path $file -Destination "Huong_Dan_Chat_Xep\" -Force
        Write-Host "Moved $file to Huong_Dan_Chat_Xep"
    }
}

# Move Org Chart files
$orgChartFiles = @("org chart", "org-chart.html", "org-chart-v2.html", "job_descriptions.md")
foreach ($file in $orgChartFiles) {
    if (Test-Path -Path $file) {
        Move-Item -Path $file -Destination "Org_Chart_JD\" -Force
        Write-Host "Moved $file to Org_Chart_JD"
    }
}

# Move Network Mapping files
$networkFiles = @("Copy of Network-Copy of KTC Coverage Full (Province → L1 → L2).jpg", "Danh_sach_GXT_KTC.csv", "Danh_sach_GXT_KTC_fixed.csv")
foreach ($file in $networkFiles) {
    if (Test-Path -Path $file) {
        Move-Item -Path $file -Destination "Network_Mapping_GXT_KTC\" -Force
        Write-Host "Moved $file to Network_Mapping_GXT_KTC"
    }
}

# Move Kho B2B files
$khoB2bFiles = @("Kho B2B", "Kho B2B.txt")
foreach ($file in $khoB2bFiles) {
    if (Test-Path -Path $file) {
        Move-Item -Path $file -Destination "Kho_B2B_Optimization\" -Force
        Write-Host "Moved $file to Kho_B2B_Optimization"
    }
}

# Move AI Agents files
$aiAgentsFiles = @("SKILL.md", "agents")
foreach ($file in $aiAgentsFiles) {
    if (Test-Path -Path $file) {
        Move-Item -Path $file -Destination "AI_Agents\" -Force
        Write-Host "Moved $file to AI_Agents"
    }
}

# Move Docs files
$docsFiles = @("HUONG_DAN_SU_DUNG.md")
foreach ($file in $docsFiles) {
    if (Test-Path -Path $file) {
        Move-Item -Path $file -Destination "Docs\" -Force
        Write-Host "Moved $file to Docs"
    }
}

Write-Host "Done organizing files!"
