import React from 'react';

// Feedback goes to the project's GitHub issues: a new tab opens with the issue form filled in
// (a free GitHub account is needed to send it). The technical line helps reproduce bugs.

const ISSUES = 'https://github.com/Hans21223/thundercard/issues/new';

const openIssue = (label: string, title: string, body: string) =>
  window.open(`${ISSUES}?${new URLSearchParams({ labels: label, title, body })}`, '_blank', 'noopener');

export const FeedbackModal: React.FC<{ context: string; onClose: () => void }> = ({ context, onClose }) => {
  const tech = [
    `ThunderCard ${import.meta.env.VITE_APP_VERSION ?? 'dev'}`,
    context,
    `${screen.width}×${screen.height}`,
    navigator.userAgent,
  ].join(' · ');
  const choices = [
    {
      title: 'Report a bug',
      hint: 'Something looks wrong or does not work.',
      go: () =>
        openIssue(
          'bug',
          'Bug: ',
          `**What happened?**\n\n\n**What did you expect?**\n\n\n**Steps to make it happen**\n1. \n\n(Screenshots help: paste them here.)\n\n---\n${tech}`
        ),
    },
    {
      title: 'Suggest an idea or give feedback',
      hint: 'A feature you would like, or anything you want to say.',
      go: () => openIssue('enhancement', 'Idea: ', `**Your idea or feedback**\n\n\n---\n${tech}`),
    },
  ];
  return (
    <div className="ui-modal" onClick={onClose}>
      <div className="w-[26rem] bg-[#1e2328] border border-[#353e47] p-4 space-y-2" onClick={(e) => e.stopPropagation()}>
        <div className="font-bold text-[#f0f0f0]">Feedback</div>
        {choices.map((c) => (
          <button
            key={c.title}
            type="button"
            onClick={() => {
              c.go();
              onClose();
            }}
            className="ui-choice w-full !py-2"
          >
            <span className="block text-[13px] text-[#f0f0f0]">{c.title}</span>
            <span className="block text-[12px]">{c.hint}</span>
          </button>
        ))}
        <div className="text-[12px] text-[#8a939b]">
          Opens GitHub in a new tab with the form filled in; you need a free GitHub account to send it.
        </div>
        <div className="flex justify-end">
          <button type="button" onClick={onClose} className="ui-btn">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
