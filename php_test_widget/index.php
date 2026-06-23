<?php
// Standalone PHP Form for Testing Repair Request API Submission

// --- CONFIGURATION ---
// Replace this with your actual Shop UUID from your Dashboard
$shop_id = "change_this_to_your_actual_shop_uuid";
// Your active ngrok URL or local backend URL
$api_url = "http://localhost:4000/api/public/widget/request";

$message = "";
$message_class = "";

// Handle form post submission
if ($_SERVER["REQUEST_METHOD"] === "POST") {
    // Collect and sanitize inputs
    $first_name = trim($_POST['first_name'] ?? '');
    $last_name = trim($_POST['last_name'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $phone = trim($_POST['phone'] ?? '');
    $device_brand = trim($_POST['device_brand'] ?? '');
    $device_type = trim($_POST['device_type'] ?? '');
    $device_model = trim($_POST['device_model'] ?? '');
    $repair_type = trim($_POST['repair_type'] ?? '');
    $issue_description = trim($_POST['issue_description'] ?? '');
    
    $appointment_date = $_POST['appointment_date'] ?? '';
    $appointment_time = $_POST['appointment_time'] ?? '';

    // Convert date + time to ISO format
    $preferred_appointment = "";
    if (!empty($appointment_date) && !empty($appointment_time)) {
        $preferred_appointment = date('c', strtotime($appointment_date . ' ' . $appointment_time));
    }

    // Build the post payload array
    $post_data = array(
        'shopId' => $shop_id,
        'customerName' => $first_name . ' ' . $last_name,
        'customerEmail' => $email,
        'customerPhone' => $phone,
        'deviceBrand' => $device_brand,
        'deviceType' => $device_type,
        'deviceModel' => $device_model,
        'repairType' => $repair_type,
        'issueDescription' => $issue_description,
    );

    if (!empty($preferred_appointment)) {
        $post_data['preferredAppointment'] = $preferred_appointment;
    }

    // Handle optional file upload
    if (isset($_FILES['photo']) && $_FILES['photo']['error'] === UPLOAD_ERR_OK) {
        $post_data['photo'] = new CURLFile(
            $_FILES['photo']['tmp_name'],
            $_FILES['photo']['type'],
            $_FILES['photo']['name']
        );
    }

    // execute cURL POST request
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $api_url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $post_data);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $result = json_decode($response, true);

    if ($http_code === 201 && isset($result['success']) && $result['success']) {
        $message = "Success! The request has been sent to your dashboard.";
        $message_class = "success-box";
    } else {
        $err_msg = $result['message'] ?? 'An error occurred during submission.';
        $message = "Submission Failed (HTTP $http_code): " . $err_msg;
        $message_class = "error-box";
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Standalone PHP Repair Request Form</title>
    <style>
        :root {
            --primary: #0284c7;
            --primary-hover: #0369a1;
            --bg: #f8fafc;
            --card-bg: #ffffff;
            --text: #1e293b;
            --border: #cbd5e1;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: var(--bg);
            color: var(--text);
            margin: 0;
            padding: 40px 20px;
            display: flex;
            justify-content: center;
        }
        .container {
            width: 100%;
            max-width: 600px;
            background: var(--card-bg);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05);
        }
        h2 {
            margin-top: 0;
            font-size: 24px;
            border-bottom: 2px solid #f1f5f9;
            padding-bottom: 15px;
            color: #0f172a;
        }
        .form-row {
            display: flex;
            gap: 15px;
        }
        .form-group {
            flex: 1;
            margin-bottom: 18px;
            display: flex;
            flex-direction: column;
        }
        label {
            font-weight: 600;
            font-size: 13px;
            color: #475569;
            margin-bottom: 6px;
        }
        input[type="text"], input[type="email"], input[type="date"], input[type="time"], textarea {
            padding: 10px 12px;
            border: 1px solid var(--border);
            border-radius: 6px;
            font-size: 14px;
            background-color: #fff;
            color: var(--text);
            transition: border-color 0.2s, box-shadow 0.2s;
        }
        input:focus, textarea:focus {
            outline: none;
            border-color: var(--primary);
            box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.15);
        }
        textarea {
            resize: vertical;
        }
        .file-input-wrapper {
            border: 2px dashed var(--border);
            padding: 15px;
            text-align: center;
            border-radius: 8px;
            cursor: pointer;
            background: #f8fafc;
        }
        .file-input-wrapper:hover {
            border-color: var(--primary);
            background: #f0f9ff;
        }
        .file-input-wrapper input {
            display: none;
        }
        .file-label {
            font-size: 14px;
            color: #64748b;
            cursor: pointer;
        }
        button {
            background-color: var(--primary);
            color: #ffffff;
            border: none;
            padding: 12px 24px;
            font-size: 16px;
            font-weight: 600;
            border-radius: 6px;
            cursor: pointer;
            width: 100%;
            transition: background-color 0.2s;
            margin-top: 10px;
        }
        button:hover {
            background-color: var(--primary-hover);
        }
        .success-box {
            padding: 15px;
            background-color: #f0fdf4;
            color: #166534;
            border: 1px solid #bbf7d0;
            border-radius: 8px;
            font-weight: 500;
            margin-bottom: 20px;
            font-size: 14px;
        }
        .error-box {
            padding: 15px;
            background-color: #fef2f2;
            color: #991b1b;
            border: 1px solid #fee2e2;
            border-radius: 8px;
            font-weight: 500;
            margin-bottom: 20px;
            font-size: 14px;
        }
    </style>
</head>
<body>

<div class="container">
    <h2>Request Repair Form (PHP Test)</h2>
    
    <?php if (!empty($message)): ?>
        <div class="<?php echo $message_class; ?>">
            <?php echo htmlspecialchars($message); ?>
        </div>
    <?php endif; ?>

    <form action="" method="POST" enctype="multipart/form-data">
        <div class="form-row">
            <div class="form-group">
                <label for="first_name">First Name *</label>
                <input type="text" id="first_name" name="first_name" required placeholder="John">
            </div>
            <div class="form-group">
                <label for="last_name">Last Name *</label>
                <input type="text" id="last_name" name="last_name" required placeholder="Doe">
            </div>
        </div>

        <div class="form-row">
            <div class="form-group">
                <label for="email">E-Mail Address *</label>
                <input type="email" id="email" name="email" required placeholder="john.doe@example.com">
            </div>
            <div class="form-group">
                <label for="phone">Telephone Number *</label>
                <input type="text" id="phone" name="phone" required placeholder="+1 555-123-4567">
            </div>
        </div>

        <div class="form-row">
            <div class="form-group">
                <label for="device_brand">Device Brand *</label>
                <input type="text" id="device_brand" name="device_brand" required placeholder="e.g. Apple">
            </div>
            <div class="form-group">
                <label for="device_type">Device Type *</label>
                <input type="text" id="device_type" name="device_type" required placeholder="e.g. Smartphone">
            </div>
        </div>

        <div class="form-row">
            <div class="form-group">
                <label for="device_model">Device Model *</label>
                <input type="text" id="device_model" name="device_model" required placeholder="e.g. iPhone 14 Pro">
            </div>
            <div class="form-group">
                <label for="repair_type">Repair Selection *</label>
                <input type="text" id="repair_type" name="repair_type" required placeholder="e.g. Display Repair">
            </div>
        </div>

        <div class="form-row">
            <div class="form-group">
                <label for="appointment_date">Preferred Date</label>
                <input type="date" id="appointment_date" name="appointment_date">
            </div>
            <div class="form-group">
                <label for="appointment_time">Preferred Time</label>
                <input type="time" id="appointment_time" name="appointment_time">
            </div>
        </div>

        <div class="form-group">
            <label for="issue_description">Your Message / Issue Description *</label>
            <textarea id="issue_description" name="issue_description" rows="4" required placeholder="Briefly describe the damage or symptoms..."></textarea>
        </div>

        <div class="form-group">
            <label>Upload Photo of Damage (Optional)</label>
            <div class="file-input-wrapper" onclick="document.getElementById('photo').click()">
                <span class="file-label" id="file-chosen-text">Click here to choose an image...</span>
                <input type="file" id="photo" name="photo" accept="image/*" onchange="updateFileName(this)">
            </div>
        </div>

        <button type="submit">Submit Request</button>
    </form>
</div>

<script>
function updateFileName(input) {
    const textSpan = document.getElementById('file-chosen-text');
    if (input.files && input.files.length > 0) {
        textSpan.textContent = "Selected: " + input.files[0].name;
    } else {
        textSpan.textContent = "Click here to choose an image...";
    }
}
</script>

</body>
</html>
