/* =========================================================
   CONVITE — ALANA 19
   JS PRINCIPAL
   ========================================================= */

/* =========================================================
   1. CONFIGURAÇÃO
   ========================================================= */

const CONFIG = {
    SHEETS_URL: "https://script.google.com/macros/s/AKfycbzHBsqtEphQOgcTPlGJyX2KX_EdrZVTfIi5yJ6MR7oo1VBgm6b5613O5axV7G9QS9ur/exec",

    MAX_COMPANIONS: 4,

    MESSAGES: {
        yes: "Eba! Aguardo você!",
        no: "Aw :c resposta enviada com sucesso",
        error: "Não foi possível enviar sua resposta. Tente novamente."
    }
};

/* =========================================================
   2. ELEMENTOS
   ========================================================= */

const intro = document.querySelector("#intro");
const envelope = document.querySelector("#open-envelope");
const invitation = document.querySelector("#invitation");
const particles = document.querySelector("#particles");

const envelopeStage = document.querySelector(".envelope__stage");
const envelopeFlap = document.querySelector(".envelope__flap-hinge");
const envelopeLetter = document.querySelector(".envelope__letter-track");

const form = document.querySelector("#rsvp-form");
const guestName = document.querySelector("#guest-name");
const companions = document.querySelector("#companions");
const companionsField = document.querySelector("#companions-field");
const feedback = document.querySelector("#rsvp-feedback");
const submitButton = document.querySelector("#rsvp-submit");

const attendanceOptions = document.querySelectorAll(
    'input[name="presenca"]'
);

/* =========================================================
   3. MOVIMENTO REDUZIDO
   ========================================================= */

const motionQuery = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
);

function getAnimationTimings() {
    if (motionQuery.matches) {
        return {
            flapStart: 90,
            letterStart: 180,
            transitionEnd: 700
        };
    }

    return {
        flapStart: 220,
        letterStart: 760,
        transitionEnd: 1550
    };
}

let animationTimings = getAnimationTimings();

function updateMotionPreference() {
    animationTimings = getAnimationTimings();
}

if (typeof motionQuery.addEventListener === "function") {
    motionQuery.addEventListener("change", updateMotionPreference);
} else if (typeof motionQuery.addListener === "function") {
    motionQuery.addListener(updateMotionPreference);
}

/* =========================================================
   4. ABERTURA DO ENVELOPE
   ========================================================= */

let envelopeOpened = false;

function showInvitation() {
    if (intro) {
        intro.hidden = true;
    }

    if (invitation) {
        invitation.hidden = false;
        invitation.classList.add("is-visible");
    }

    if (envelope) {
        envelope.setAttribute("aria-expanded", "true");
    }
}

function openEnvelope() {
    if (envelopeOpened) {
        return;
    }

    envelopeOpened = true;

    if (!envelope || !intro) {
        showInvitation();
        return;
    }

    envelope.classList.add("is-opening");
    intro.classList.add("is-opening");

    /*
        Mesmo com movimento reduzido,
        mantemos a abertura — só deixamos
        mais curta e sem partículas.
    */

    envelopeStage?.classList.add("is-seal-released");

    if (!motionQuery.matches) {
        createParticles();
    }

    window.setTimeout(() => {
        envelopeFlap?.classList.add("is-flap-open");
    }, animationTimings.flapStart);

    window.setTimeout(() => {
        envelopeLetter?.classList.add("is-letter-revealed");
    }, animationTimings.letterStart);

    window.setTimeout(() => {
        showInvitation();
    }, animationTimings.transitionEnd);
}

envelope?.addEventListener("click", openEnvelope);

/* =========================================================
   5. PARTÍCULAS
   ========================================================= */

function createParticles() {
    if (!particles) {
        return;
    }

    particles.replaceChildren();

    const particleCount = 18;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement("span");

        particle.classList.add("particle");

        particle.style.setProperty(
            "--particle-x",
            `${Math.random() * 100}%`
        );

        particle.style.setProperty(
            "--particle-delay",
            `${Math.random() * 0.4}s`
        );

        particle.style.setProperty(
            "--particle-duration",
            `${0.9 + Math.random() * 0.8}s`
        );

        particle.classList.add(
            Math.random() > 0.5
                ? "particle--red"
                : "particle--silver"
        );

        particles.appendChild(particle);
    }
}

/* =========================================================
   6. CONTROLE DE PRESENÇA
   ========================================================= */

function getAttendance() {
    return document.querySelector(
        'input[name="presenca"]:checked'
    )?.value ?? "";
}

function updateCompanionsField() {
    const attendance = getAttendance();
    const willAttend = attendance === "Sim";

    if (!companions) {
        return;
    }

    companions.disabled = !willAttend;
    companions.required = willAttend;

    if (companionsField) {
        companionsField.hidden = !willAttend;
    }

    if (!willAttend) {
        companions.value = "";
        companions.setCustomValidity("");
    }

    clearFeedback();
}

attendanceOptions.forEach((option) => {
    option.addEventListener("change", updateCompanionsField);
});

/* =========================================================
   7. VALIDAÇÃO DE ACOMPANHANTES
   ========================================================= */

function validateCompanions() {
    if (getAttendance() !== "Sim") {
        return true;
    }

    if (!companions) {
        return false;
    }

    const rawValue = companions.value.trim();

    if (rawValue === "") {
        companions.setCustomValidity(
            "Informe a quantidade de acompanhantes."
        );

        companions.reportValidity();
        return false;
    }

    const quantity = Number(rawValue);

    const valid =
        Number.isInteger(quantity) &&
        quantity >= 0 &&
        quantity <= CONFIG.MAX_COMPANIONS;

    if (!valid) {
        companions.setCustomValidity(
            "Informe um número inteiro de 0 a 4."
        );

        companions.reportValidity();
        return false;
    }

    companions.setCustomValidity("");
    return true;
}

companions?.addEventListener("input", () => {
    companions.setCustomValidity("");
    clearFeedback();

    if (companions.value !== "") {
        const quantity = Number(companions.value);

        if (quantity > CONFIG.MAX_COMPANIONS) {
            companions.value = String(CONFIG.MAX_COMPANIONS);
        }

        if (quantity < 0) {
            companions.value = "0";
        }
    }
});

/* =========================================================
   8. FEEDBACK
   ========================================================= */

function showFeedback(message, type) {
    if (!feedback) {
        return;
    }

    feedback.textContent = message;
    feedback.dataset.state = type;
}

function clearFeedback() {
    if (!feedback) {
        return;
    }

    feedback.textContent = "";
    delete feedback.dataset.state;
}

/* =========================================================
   9. ENVIO PARA GOOGLE SHEETS
   ========================================================= */

let sending = false;

form?.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (sending) {
        return;
    }

    clearFeedback();

    if (!guestName || !submitButton) {
        return;
    }

    const name = guestName.value.trim();
    const attendance = getAttendance();

    if (!name) {
        guestName.setCustomValidity(
            "Informe seu nome para continuar."
        );

        guestName.reportValidity();
        return;
    }

    guestName.setCustomValidity("");

    if (!attendance) {
        showFeedback(
            "Selecione uma opção de presença.",
            "error"
        );
        return;
    }

    if (!validateCompanions()) {
        return;
    }

    const companionCount =
        attendance === "Sim"
            ? Number(companions.value)
            : "";

    const payload = {
        nome: name,
        presenca: attendance,
        acompanhantes: companionCount
    };

    if (
        !CONFIG.SHEETS_URL ||
        CONFIG.SHEETS_URL.includes(
            "COLE_A_URL_DO_GOOGLE_APPS_SCRIPT_AQUI"
        )
    ) {
        showFeedback(
            "O formulário está pronto, mas falta conectar a planilha.",
            "error"
        );
        return;
    }

    sending = true;
    submitButton.disabled = true;

    const originalButtonText = submitButton.textContent;
    submitButton.textContent = "Enviando...";

    try {
        const body = new URLSearchParams({
            nome: payload.nome,
            presenca: payload.presenca,
            acompanhantes: String(payload.acompanhantes)
        });

        await fetch(CONFIG.SHEETS_URL, {
            method: "POST",
            mode: "no-cors",
            body
        });

        form.reset();
        updateCompanionsField();

        showFeedback(
            CONFIG.MESSAGES[
                attendance === "Sim" ? "yes" : "no"
            ],
            "success"
        );

    } catch (error) {
        console.error(
            "Erro ao enviar a confirmação:",
            error
        );

        showFeedback(
            CONFIG.MESSAGES.error,
            "error"
        );

    } finally {
        sending = false;
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
    }
});

/* =========================================================
   10. ESTADO INICIAL
   ========================================================= */

updateCompanionsField();