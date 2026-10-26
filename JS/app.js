/* =========================================================
   CONFIGURAÇÕES
========================================================= */

const CONFIG = {
    SHEETS_URL:
        "https://script.google.com/macros/s/AKfycbzHBsqtEphQOgcTPlGJyX2KX_EdrZVTfIi5yJ6MR7oo1VBgm6b5613O5axV7G9QS9ur/exec",

    MAX_COMPANIONS: 4,

    MESSAGES: {
        yes: "Eba! Aguardo você!",
        no: "Aw :c resposta enviada com sucesso",
        error: "Não foi possível enviar sua resposta. Tente novamente."
    }
};

/* =========================================================
   ELEMENTOS
========================================================= */

const intro = document.querySelector("#intro");
const envelope = document.querySelector("#open-envelope");
const invitation = document.querySelector("#invitation");
const particles = document.querySelector("#particles");

const envelopeStage = document.querySelector(
    ".envelope__stage"
);

const envelopeLetter = document.querySelector(
    ".envelope__letter-track"
);

const motionQuery = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
);

/* =========================================================
   PARTÍCULAS
========================================================= */

function createParticles() {
    if (!particles || motionQuery.matches) {
        return;
    }

    particles.replaceChildren();

    for (let i = 0; i < 18; i++) {
        const particle = document.createElement("span");

        particle.className = `particle ${
            Math.random() > 0.5
                ? "particle--red"
                : "particle--silver"
        }`;

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

        particles.appendChild(particle);
    }
}

/* =========================================================
   ABERTURA DO CONVITE
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

    envelope?.setAttribute("aria-expanded", "true");

    window.scrollTo({
        top: 0,
        behavior: "instant"
    });
}

function openEnvelope() {
    if (envelopeOpened) {
        return;
    }

    envelopeOpened = true;

    if (!envelope || !intro || !invitation) {
        showInvitation();
        return;
    }

    const reducedMotion = motionQuery.matches;

    envelope.classList.add("is-opening");
    intro.classList.add("is-opening");

    envelopeStage?.classList.add("is-seal-released");

    if (!reducedMotion) {
        createParticles();
    }

    window.setTimeout(() => {
        envelopeLetter?.classList.add("is-letter-revealed");
    }, reducedMotion ? 230 : 620);

    window.setTimeout(
        showInvitation,
        reducedMotion ? 850 : 1900
    );
}

envelope?.addEventListener("click", openEnvelope);

/* =========================================================
   FORMULÁRIO
========================================================= */

const form = document.querySelector("#rsvp-form");
const guestName = document.querySelector("#guest-name");
const companions = document.querySelector("#companions");

const companionsField = document.querySelector(
    "#companions-field"
);

const feedback = document.querySelector("#rsvp-feedback");
const submitButton = document.querySelector("#rsvp-submit");

const attendanceOptions = document.querySelectorAll(
    'input[name="presenca"]'
);

function getAttendance() {
    return document.querySelector(
        'input[name="presenca"]:checked'
    )?.value ?? "";
}

/* =========================================================
   MENSAGENS
========================================================= */

function clearFeedback() {
    if (!feedback) {
        return;
    }

    feedback.textContent = "";
    delete feedback.dataset.state;
}

function showFeedback(message, state) {
    if (!feedback) {
        return;
    }

    feedback.textContent = message;
    feedback.dataset.state = state;
}

/* =========================================================
   ACOMPANHANTES
========================================================= */

function updateCompanions() {
    if (!companions) {
        return;
    }

    const attending = getAttendance() === "Sim";

    companions.disabled = !attending;
    companions.required = attending;

    if (companionsField) {
        companionsField.hidden = !attending;
    }

    if (!attending) {
        companions.value = "";
        companions.setCustomValidity("");
    }

    clearFeedback();
}

attendanceOptions.forEach((option) => {
    option.addEventListener("change", updateCompanions);
});

guestName?.addEventListener("input", () => {
    guestName.setCustomValidity("");
    clearFeedback();
});

companions?.addEventListener("input", () => {
    companions.setCustomValidity("");
    clearFeedback();
});

/* =========================================================
   ENVIO PARA O GOOGLE SHEETS
========================================================= */

let sending = false;

form?.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (sending || !guestName || !submitButton) {
        return;
    }

    clearFeedback();

    const name = guestName.value.trim();
    const presence = getAttendance();

    if (!name) {
        guestName.setCustomValidity(
            "Informe seu nome para continuar."
        );

        guestName.reportValidity();
        return;
    }

    guestName.setCustomValidity("");

    if (!presence) {
        showFeedback(
            "Selecione uma opção de presença.",
            "error"
        );

        return;
    }

    if (presence === "Sim") {
        const raw = companions?.value.trim() ?? "";
        const quantity = Number(raw);

        const valid =
            raw !== "" &&
            Number.isInteger(quantity) &&
            quantity >= 0 &&
            quantity <= CONFIG.MAX_COMPANIONS;

        companions?.setCustomValidity(
            valid
                ? ""
                : "Informe um número inteiro de 0 a 4."
        );

        if (!valid) {
            companions?.reportValidity();
            return;
        }
    }

    const body = new URLSearchParams({
        nome: name,
        presenca: presence,
        acompanhantes:
            presence === "Sim"
                ? companions.value
                : ""
    });

    sending = true;
    submitButton.disabled = true;

    const originalLabel = submitButton.textContent;
    submitButton.textContent = "Enviando...";

    try {
        await fetch(CONFIG.SHEETS_URL, {
            method: "POST",
            mode: "no-cors",
            body
        });

        form.reset();
        updateCompanions();

        showFeedback(
            presence === "Sim"
                ? CONFIG.MESSAGES.yes
                : CONFIG.MESSAGES.no,
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
        submitButton.textContent = originalLabel;
    }
});

/* =========================================================
   INICIALIZAÇÃO
========================================================= */

updateCompanions();