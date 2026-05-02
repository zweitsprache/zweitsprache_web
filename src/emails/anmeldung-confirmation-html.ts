function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface AnmeldungConfirmationHtmlProps {
  vorname: string;
  name: string;
  workshopTitle: string;
  workshopSubtitle?: string | null;
  firstDate?: string | null;
  timeRange?: string | null;
  preisLabel?: string | null;
}

export function buildAnmeldungConfirmationHtml({
  vorname,
  name,
  workshopTitle,
  workshopSubtitle,
  firstDate,
  timeRange,
  preisLabel,
}: AnmeldungConfirmationHtmlProps): string {
  const safeVorname = escapeHtml(vorname || "");
  const safeName = escapeHtml(name || "");
  const safeWorkshopTitle = escapeHtml(workshopTitle || "");
  const safeWorkshopSubtitle = escapeHtml(workshopSubtitle || "");
  const safeDate = escapeHtml(firstDate || "");
  const safeTime = escapeHtml(timeRange || "");
  const safePrice = escapeHtml(preisLabel || "");

  const template = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="de">
 <head>
  <meta charset="UTF-8">
  <meta content="width=device-width, initial-scale=1" name="viewport">
  <meta name="x-apple-disable-message-reformatting">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta content="telephone=no" name="format-detection">
  <title>Anmeldebestätigung</title>
  <!--[if !mso]><!-- -->
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Encode+Sans+Semi+Condensed:wght@100;200;300;400;500;600;700;800;900&display=swap"><!--<![endif]-->
  <style type="text/css">@import url('https://fonts.googleapis.com/css2?family=Encode+Sans+Semi+Condensed:wght@100;200;300;400;500;600;700;800;900&display=swap');
.rollover:hover .rollover-first { max-height:0px!important; display:none!important; }
.rollover:hover .rollover-second { max-height:none!important; display:block!important; }
.rollover span { font-size:0px; }
u + .body img ~ div div { display:none; }
#outlook a { padding:0; }
span.MsoHyperlink, span.MsoHyperlinkFollowed { color:inherit; mso-style-priority:99; }
a.u { mso-style-priority:100!important; text-decoration:none!important; }
a[x-apple-data-detectors], #MessageViewBody a {
  color:inherit!important; text-decoration:none!important; font-size:inherit!important;
  font-family:inherit!important; font-weight:inherit!important; line-height:inherit!important;
}
body, table, td, p, a, span, strong, h1, h2, h3, h4, h5, h6 {
  font-family:'Encode Sans Semi Condensed', 'Helvetica Neue', Helvetica, Arial, sans-serif !important;
}
.i { display:none; float:left; overflow:hidden; width:0; max-height:0; line-height:0; mso-hide:all; }
form button:focus, form input:focus, form textarea:focus { outline:none }
@media only screen and (max-width:600px) {*[class="gmail-fix"] { display:none!important }p, a { line-height:150%!important }h1, h1 a { line-height:120%!important }h2, h2 a { line-height:120%!important }h3, h3 a { line-height:120%!important }h4, h4 a { line-height:120%!important }h5, h5 a { line-height:120%!important }h6, h6 a { line-height:120%!important }h1 { font-size:36px!important; text-align:left }h2 { font-size:26px!important; text-align:left }h3 { font-size:20px!important; text-align:left }h4 { font-size:24px!important; text-align:left }h5 { font-size:20px!important; text-align:left }h6 { font-size:16px!important; text-align:left }.bd p, .bd a { font-size:14px!important }.f, .f h1, .f h2, .f h3, .f h4, .f h5, .f h6 { text-align:left!important }.d .rollover:hover .rollover-second, .g .rollover:hover .rollover-second, .f .rollover:hover .rollover-second { display:inline!important }.n table, .o table, .p table, .n, .p, .o { width:100%!important; max-width:600px!important }.adapt-img { width:100%!important; height:auto!important }.h-auto { height:auto!important }.a .b, .a .b * { font-size:12px!important } }
@media screen and (max-width:384px) {.mail-message-content { width:414px!important } }</style>
 </head>
 <body class="body" style="width:100%;height:100%;font-family:arial, 'helvetica neue', helvetica, sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;padding:0;Margin:0">
  <div dir="ltr" class="es-wrapper-color" lang="de" style="background-color:#FFFFFF">
   <table width="100%" cellspacing="0" cellpadding="0" class="es-wrapper" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-spacing:0px;padding:0;Margin:0;width:100%;height:100%;background-repeat:repeat;background-position:center top">
     <tr>
      <td valign="top" style="padding:0;Margin:0">
       <table cellspacing="0" cellpadding="0" align="center" class="n" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-spacing:0px;width:100%;table-layout:fixed !important">
         <tr>
          <td align="center" style="padding:0;Margin:0">
           <table cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center" class="bd" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-spacing:0px;background-color:#FFFFFF;width:600px">
             <tr>
              <td align="left" style="padding:20px 20px 0;Margin:0">
               <table width="100%" cellspacing="0" cellpadding="0" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-spacing:0px">
                 <tr>
                  <td valign="top" align="center" style="padding:0;Margin:0;width:560px">
                   <table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-spacing:0px">
                     <tr>
                      <td align="left" style="padding:0 0 25px;Margin:0;font-size:0"><img src="https://qppqed.stripocdn.email/content/guids/CABINET_eae7fb052cec6edc2fa62afb512174b3963a1dc31ac502d619c7090e10356015/images/zwe_logo_2020_y.png" alt="" width="30" style="display:block;font-size:14px;border:0;outline:none;text-decoration:none;margin:0"></td>
                     </tr>
                   </table></td>
                 </tr>
               </table></td>
             </tr>
             <tr>
              <td align="left" style="padding:20px 20px 0;Margin:0">
               <table width="100%" cellpadding="0" cellspacing="0" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-spacing:0px">
                 <tr>
                  <td align="left" style="padding:0;Margin:0;width:560px">
                   <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-spacing:0px">
                     <tr>
                      <td align="left" class="a" style="padding:5px 0 10px;Margin:0"><p class="f" style="Margin:0;mso-line-height-rule:exactly;font-family:'Encode Sans Semi Condensed', sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px"><strong style="font-weight:700 !important">Guten Tag [Vorname] [Nachname]</strong></p></td>
                     </tr>
                     <tr>
                      <td align="left" style="padding:5px 0 10px;Margin:0"><p style="Margin:0;mso-line-height-rule:exactly;font-family:'Encode Sans Semi Condensed', sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px">Besten Dank für Ihre Anmeldung.</p></td>
                     </tr>
                   </table></td>
                 </tr>
               </table></td>
             </tr>
             <tr>
              <td align="left" style="padding:20px 20px 0;Margin:0">
               <table width="100%" cellpadding="0" cellspacing="0" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-spacing:0px">
                 <tr>
                  <td align="left" style="padding:0;Margin:0;width:560px">
                   <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-spacing:0px">
                     <tr>
                      <td align="left" style="padding:0;Margin:0"><p style="Margin:0;mso-line-height-rule:exactly;font-family:'Encode Sans Semi Condensed', sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px"><strong style="font-weight:700 !important">[workshop_title]</strong><br>[workshop subtitle]<br>[date] | [time]<br>[price]</p></td>
                     </tr>
                   </table></td>
                 </tr>
               </table></td>
             </tr>
             <tr>
              <td align="left" style="padding:20px 20px 0;Margin:0">
               <table width="100%" cellpadding="0" cellspacing="0" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-spacing:0px">
                 <tr>
                  <td align="left" style="padding:0;Margin:0;width:560px">
                   <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-spacing:0px">
                     <tr>
                      <td align="left" style="padding:0;Margin:0"><p style="Margin:0;mso-line-height-rule:exactly;font-family:'Encode Sans Semi Condensed', sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px">Die Durchführung des Workshops ist bereits bestätigt. Sie erhalten in Kürze eine zweite E-Mail mit der Rechnung zur Begleichung der Teilnahmegebühr.</p></td>
                     </tr>
                   </table></td>
                 </tr>
               </table></td>
             </tr>
             <tr>
              <td align="left" style="padding:20px 20px 0;Margin:0">
               <table width="100%" cellpadding="0" cellspacing="0" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-spacing:0px">
                 <tr>
                  <td align="left" style="padding:0;Margin:0;width:560px">
                   <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-spacing:0px">
                     <tr>
                      <td align="left" style="padding:0;Margin:0"><p style="Margin:0;mso-line-height-rule:exactly;font-family:'Encode Sans Semi Condensed', sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px">Freundliche Grüsse<br><strong style="font-weight:700 !important">zweitsprache&#8203;.ch | Marcel Allenspach<br></strong>Albisstrasse 32a<br>CH-8134 Adliswil</p><p style="Margin:0;mso-line-height-rule:exactly;font-family:'Encode Sans Semi Condensed', sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px"><br></p><p style="Margin:0;mso-line-height-rule:exactly;font-family:'Encode Sans Semi Condensed', sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px">+41 44 709 20 00<br><a href="mailto:office@zweitsprache.ch" style="color:#3E5A6B !important;text-decoration:none !important;">office@zweitsprache.ch</a></p></td>
                     </tr>
                   </table></td>
                 </tr>
               </table></td>
             </tr>
             <tr>
              <td align="left" style="padding:20px 20px 0;Margin:0">
               <table width="100%" cellpadding="0" cellspacing="0" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-spacing:0px">
                 <tr>
                  <td align="left" style="padding:0;Margin:0;width:560px">
                   <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-spacing:0px">
                     <tr>
                      <td align="left" style="padding:0;Margin:0" class="a"><p class="b" style="Margin:0;mso-line-height-rule:exactly;font-family:'Encode Sans Semi Condensed', sans-serif;line-height:18px;letter-spacing:0;color:#333333;font-size:12px">Diese Nachricht, einschliesslich aller Anhänge, enthält Informationen die vertraulich und geschützt sind. Sofern Sie nicht der beabsichtigte Empfänger sind, ist jede Verwendung, Vervielfältigung, Offenlegung, Verbreitung oder Verteilung verboten. Falls Sie diese Nachricht irrtümlicherweise erhalten haben, löschen Sie die Nachricht und alle Kopien davon und weisen Sie den Absender per Antwort-E-Mail darauf hin.</p></td>
                     </tr>
                   </table></td>
                 </tr>
               </table></td>
             </tr>
           </table></td>
         </tr>
       </table></td>
     </tr>
   </table>
  </div>
 </body>
</html>`;

  return template
    .replace(/\[Vorname\]/g, safeVorname)
    .replace(/\[Nachname\]/g, safeName)
    .replace(/\[workshop_title\]/g, safeWorkshopTitle)
    .replace(/\[workshop subtitle\]/g, safeWorkshopSubtitle)
    .replace(/\[date\]/g, safeDate)
    .replace(/\[time\]/g, safeTime)
    .replace(/\[price\]/g, safePrice);
}
