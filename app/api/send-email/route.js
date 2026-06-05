import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// Mengambil semua konfigurasi murni dari Environment Variables (.env)
const resendApiKey = process.env.RESEND_API_KEY;
const internalApiKey = process.env.INTERNAL_API_KEY;
const senderEmail = process.env.RESEND_FROM_EMAIL;

const resend = resendApiKey ? new Resend(resendApiKey) : null;

export async function POST(req) {
  try {
    // 1. LAPISAN KEAMANAN: Pastikan environment variable sudah diset
    if (!internalApiKey) {
      console.error("🚨 INTERNAL_API_KEY belum diatur di .env!");
      return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
    }

    // 2. VALIDASI AUTENTIKASI INTERNAL
    const authHeader = req.headers.get('authorization');
    if (!authHeader || authHeader !== `Bearer ${internalApiKey}`) {
      console.warn('⚠️ Akses ditolak ke API Email: Authorization Header tidak valid.');
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { to, subject, type, orderData } = await req.json();

    if (!to || !type || !orderData) {
      return NextResponse.json({ error: "Data email tidak lengkap" }, { status: 400 });
    }

    // --- TEMPLATE EMAIL HTML ---
    let htmlContent = '';
    const formatRupiah = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

    if (type === 'PAID') {
      htmlContent = `
        <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #0f172a;">Pembayaran Berhasil! 🎉</h2>
          <p style="color: #475569; font-size: 16px;">Halo <strong>${orderData.customer_name}</strong>,</p>
          <p style="color: #475569; font-size: 16px;">Terima kasih atas pesanan Anda. Kami telah menerima pembayaran untuk Invoice <strong>${orderData.invoice_number}</strong> sebesar <strong>${formatRupiah(orderData.total_amount)}</strong>.</p>
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #334155; font-size: 14px;">Pesanan Anda sedang kami proses dan akan segera dikirimkan ke alamat:</p>
            <p style="margin: 8px 0 0 0; color: #0f172a; font-weight: bold; font-size: 14px;">${orderData.shipping_address}</p>
          </div>
          <p style="color: #475569; font-size: 14px;">Kami akan mengabari Anda kembali saat pesanan sudah dikirim.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
          <p style="color: #94a3b8; font-size: 12px; text-align: center;">Tim Warhope Apparel</p>
        </div>
      `;
    } else if (type === 'SHIPPED') {
      htmlContent = `
        <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #0f172a;">Pesanan Anda Telah Dikirim! 🚚</h2>
          <p style="color: #475569; font-size: 16px;">Halo <strong>${orderData.customer_name}</strong>,</p>
          <p style="color: #475569; font-size: 16px;">Kabar gembira! Pesanan Anda (<strong>${orderData.invoice_number}</strong>) sudah diserahkan ke kurir pengiriman.</p>
          <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; color: #1e3a8a; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Nomor Resi Pengiriman</p>
            <p style="margin: 8px 0 0 0; color: #1d4ed8; font-weight: 900; font-size: 24px; letter-spacing: 2px;">${orderData.tracking_number}</p>
          </div>
          <p style="color: #475569; font-size: 14px;">Anda dapat melacak status pengiriman langsung dari halaman Profil akun Warhope Anda.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
          <p style="color: #94a3b8; font-size: 12px; text-align: center;">Tim Warhope Apparel</p>
        </div>
      `;
    }

    if (!resendApiKey || !senderEmail) {
      console.log("✉️ [SIMULASI EMAIL] Mengirim email ke:", to);
      console.log("Subjek:", subject);
      return NextResponse.json({ success: true, simulated: true, message: "Email disimulasikan (Kredensial belum lengkap di .env)" });
    }

    // 3. KIRIM EMAIL MENGGUNAKAN DATA DINAMIS DARI ENV
    const data = await resend.emails.send({
      from: senderEmail,
      to: [to],
      subject: subject,
      html: htmlContent,
    });

    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error("Gagal mengirim email:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}