@echo off
REM ==========================================================
REM  Recursively downscales all .webp images to 10% size
REM  Skips files that already have _LD suffix
REM  Keeps originals and saves new ones with "_LD" suffix
REM  Requires ImageMagick ("magick" command)
REM ==========================================================

setlocal enabledelayedexpansion

echo Counting WEBP files...
set count=0
for /r %%F in (*.webp) do (
    REM Skip files already ending with _LD.webp
    echo %%~nxF | findstr /i "_LD.webp" >nul
    if errorlevel 1 (
        set /a count+=1
    )
)
echo Found %count% file(s) to downscale.
echo.

if %count%==0 (
    echo No eligible WEBP files found. Exiting.
    pause
    exit /b
)

set current=0
for /r %%F in (*.webp) do (
    REM Skip files already ending with _LD.webp
    echo %%~nxF | findstr /i "_LD.webp" >nul
    if errorlevel 1 (
        set /a current+=1
        echo [!current!/%count%] Downscaling: %%~nxF
        magick "%%F" -resize 10%% "%%~dpnF_LD.webp"
    )
)

echo.
echo All %count% WEBP files have been downscaled successfully.
pause
