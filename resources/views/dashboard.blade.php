<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Energy Equity - Project Control Dashboard</title>

    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">

    <!-- Pass Database Data to JavaScript -->
    <script>
        window.__LARAVEL_DATABASE_DATA__ = {
            projects: @json($projects),
            selectedProject: @json($selectedProject),
            source: 'MySQL Database'
        };
    </script>

    @viteReactRefresh
    @vite(['src/main.jsx'])
</head>
<body class="bg-slate-50 text-slate-800 antialiased selection:bg-blue-500 selection:text-white">
    <div id="root"></div>
</body>
</html>
